'use client';
import { useEffect, useId, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
const chartConfig = {
  confirmed: { label: 'Accepted & completed', color: '#54755c' },
  other: { label: 'Other statuses', color: '#a0b77b' },
} satisfies ChartConfig;
const ranges = [
  { value: '90', label: 'Last 90 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '7', label: 'Last 7 days' },
];
export function BookingActivityChart() {
  const [activity, setActivity] = useState<{
    timezone: string;
    data: { date: string; confirmed: number; other: number }[];
  }>();
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('90');
  const gradientId = useId().replace(/:/g, '');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await api<{
          timezone: string;
          data: { date: string; confirmed: number; other: number }[];
        }>(`/dashboard/activity?days=${timeRange}`);
        if (active) {
          setActivity(result);
          setError('');
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    };
    const initial = setTimeout(() => {
      setActivity(undefined);
      void load();
    }, 0);
    const timer = setInterval(() => void load(), 20000);
    return () => {
      active = false;
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [timeRange]);
  const data = activity?.data || [];
  const timezone = activity?.timezone || 'Salon time';
  const loading = !activity;
  const total = data.reduce((sum, day) => sum + day.confirmed + day.other, 0);
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      month: 'short',
      day: 'numeric',
    });
  return (
    <Card className="min-w-0 rounded-[14px] bg-white pt-0 shadow-none">
      <CardHeader className="flex flex-wrap items-center gap-3 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Booking activity</CardTitle>
          <CardDescription>Appointments over the last {timeRange} days</CardDescription>
        </div>
        <Select
          items={ranges}
          value={timeRange}
          onValueChange={(value) => {
            if (value) setTimeRange(value);
          }}
        >
          <SelectTrigger
            className="w-[150px] rounded-lg sm:ml-auto"
            aria-label="Booking chart date range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ranges.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      {error && activity && (
        <p role="alert" className="px-6 text-sm text-red-700">
          {error}
        </p>
      )}
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading ? (
          <div
            className="flex h-[250px] items-center justify-center text-sm text-muted-foreground"
            role="status"
          >
            {error || 'Loading booking activity...'}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 10, top: 8 }}>
              <defs>
                {['confirmed', 'other'].map((key) => (
                  <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={formatDate}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, (maximum: number) => Math.max(1, maximum)]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDate(String(value))}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="other"
                type="monotone"
                fill={`url(#${gradientId}-other)`}
                stroke="var(--color-other)"
                stackId="a"
                isAnimationActive={false}
              />
              <Area
                dataKey="confirmed"
                type="monotone"
                fill={`url(#${gradientId}-confirmed)`}
                stroke="var(--color-confirmed)"
                stackId="a"
                isAnimationActive={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
        <div className="mt-4 space-y-2 px-2 pb-3 text-xs text-muted-foreground" aria-live="polite">
          <p>
            {loading ? 'Waiting for salon data' : `${total} bookings in this period`} / {timezone}
          </p>
          {!loading && total === 0 && <p>No bookings scheduled in this period.</p>}

          <p>Other statuses include Pending, Declined, Cancelled, and No-show.</p>
        </div>
      </CardContent>
    </Card>
  );
}
