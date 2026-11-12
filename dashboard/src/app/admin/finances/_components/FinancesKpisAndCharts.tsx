'use client';

import React, { useState, useMemo } from 'react';
import { type MonthOption, monthNames, monthShort } from './types';
import FinancesCoreKpiCards from './FinancesCoreKpiCards';
import FinancesWaterfallAndBridge from './FinancesWaterfallAndBridge';
import FinancesGmrAndAreaCharts from './FinancesGmrAndAreaCharts';
import FinancesTrajectoryLineGraph from './FinancesTrajectoryLineGraph';

interface FinancesKpisAndChartsProps {
  monthlyDataMap: Record<string, any>;
  defaultMonthData: any;
  availableMonths: MonthOption[];
  defaultMonthKey: string;
  nowYear: number;
}

export default function FinancesKpisAndCharts({
  monthlyDataMap,
  defaultMonthData,
  availableMonths,
  defaultMonthKey,
  nowYear,
}: FinancesKpisAndChartsProps) {
  const [gmrMonth, setGmrMonth] = useState(defaultMonthKey);
  const [revAddedMonth, setRevAddedMonth] = useState(defaultMonthKey);
  const [partnerOutflowMonth, setPartnerOutflowMonth] = useState(defaultMonthKey);
  const [nrvMonth, setNrvMonth] = useState(defaultMonthKey);
  const [netProfitMonth, setNetProfitMonth] = useState(defaultMonthKey);
  const [expensesMonth, setExpensesMonth] = useState(defaultMonthKey);
  const [arrMonth, setArrMonth] = useState(defaultMonthKey);

  const [waterfallMonth, setWaterfallMonth] = useState(defaultMonthKey);
  const [bridgeMonth, setBridgeMonth] = useState(defaultMonthKey);

  const [barChartYear, setBarChartYear] = useState(nowYear);
  const [gmrCompareYoY, setGmrCompareYoY] = useState(false);

  // Cumulative Area Chart Filters & States
  const [cumulativeRangeTab, setCumulativeRangeTab] = useState<'lifetime' | 'ytd' | 'last12'>('lifetime');
  const [cumulativeUpToMonth, setCumulativeUpToMonth] = useState('ALL');
  const [activeHoverCumIdx, setActiveHoverCumIdx] = useState<number | null>(null);

  // Line Graph Filters & States
  const [lineGraphYear, setLineGraphYear] = useState(nowYear);
  const [lineGraphTimeframe, setLineGraphTimeframe] = useState<'all' | 'ytd' | 'last6' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  const [lineGraphMetric, setLineGraphMetric] = useState<'revenue' | 'netProfit' | 'partnerOutflow' | 'compareAll'>('revenue');
  const [lineGraphFocusMonth, setLineGraphFocusMonth] = useState<string>('ALL');
  const [activeHoverLineIdx, setActiveHoverLineIdx] = useState<number | null>(null);

  const [cumulativeYtd, setCumulativeYtd] = useState(false);

  // Data resolvers for each card
  const gmrData = monthlyDataMap[gmrMonth] || defaultMonthData || {};
  const revAddedData = monthlyDataMap[revAddedMonth] || defaultMonthData || {};
  const partnerOutflowData = monthlyDataMap[partnerOutflowMonth] || defaultMonthData || {};
  const nrvData = monthlyDataMap[nrvMonth] || defaultMonthData || {};
  const netProfitData = monthlyDataMap[netProfitMonth] || defaultMonthData || {};
  const expensesData = monthlyDataMap[expensesMonth] || defaultMonthData || {};
  const arrData = monthlyDataMap[arrMonth] || defaultMonthData || {};

  const waterfallDataObj = monthlyDataMap[waterfallMonth] || defaultMonthData || {};
  const waterfallItems: any[] = waterfallDataObj.waterfallData || [];

  const bridgeDataObj = monthlyDataMap[bridgeMonth] || defaultMonthData || {};
  const bridgeItems: any[] = bridgeDataObj.revenueBridgeData || [];

  const realYtdProfit = useMemo(() => {
    const parts = netProfitMonth.split('-');
    const selYear = parts[0];
    const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();
    let ytdGross = 0;
    let ytdExpenses = 0;
    for (let i = 0; i <= mIdx; i++) {
      const k = `${selYear}-${String(i + 1).padStart(2, '0')}`;
      const d = monthlyDataMap[k];
      if (d) {
        ytdGross += Number(d.grossMonthlyRevenue || 0);
        ytdExpenses += Number(d.totalOperatingExpenses || 0);
      }
    }
    return ytdGross - ytdExpenses;
  }, [monthlyDataMap, netProfitMonth]);

  const sparklinePoints = useMemo(() => {
    const parts = gmrMonth.split('-');
    const selYear = parts[0];
    const mIdx = parts.length > 1 ? parseInt(parts[1], 10) - 1 : new Date().getMonth();

    const last6 = [];
    for (let i = Math.max(0, mIdx - 5); i <= mIdx; i++) {
      const k = `${selYear}-${String(i + 1).padStart(2, '0')}`;
      const d = monthlyDataMap[k];
      last6.push(Number(d?.grossMonthlyRevenue || 0));
    }

    if (!last6.length) return '0,20 100,20';
    const min = Math.min(...last6, 0);
    const max = Math.max(...last6, 100);
    const range = max - min || 1;

    return last6
      .map((val, idx) => {
        const x = Math.round((idx / Math.max(1, last6.length - 1)) * 100);
        const y = Math.round(24 - ((val - min) / range) * 20);
        return `${x},${y}`;
      })
      .join(' ');
  }, [monthlyDataMap, gmrMonth]);

  const barChartSeriesData = useMemo(() => {
    const series = [];
    const priorSeries = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${barChartYear}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || {
        grossMonthlyRevenue: 0,
        monthName: `${monthNames[m]} ${barChartYear}`,
        monthLabel: monthShort[m],
      };
      series.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${barChartYear}`,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
        isCurrent: mKey === defaultMonthKey,
      });

      const lyKey = `${barChartYear - 1}-${String(m + 1).padStart(2, '0')}`;
      const lyData = monthlyDataMap[lyKey] || { grossMonthlyRevenue: 0 };
      priorSeries.push({
        monthKey: lyKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${barChartYear - 1}`,
        grossRevenue: Number(lyData.grossMonthlyRevenue || 0),
      });
    }

    const allVals = [
      ...series.map((s) => s.grossRevenue),
      ...priorSeries.map((s) => s.grossRevenue),
    ];
    const maxVal = Math.max(...allVals, 500) * 1.15;

    return { series, priorSeries, maxVal };
  }, [barChartYear, monthlyDataMap, defaultMonthKey]);

  const dynamicCumulativeData = useMemo(() => {
    const currentYearPoints = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${nowYear}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || { grossMonthlyRevenue: 0 };
      currentYearPoints.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${nowYear}`,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
      });
    }

    let seriesToUse = [...currentYearPoints];

    if (cumulativeRangeTab === 'ytd') {
      const parts = defaultMonthKey.split('-');
      const mIdx = parseInt(parts[1], 10) - 1;
      seriesToUse = seriesToUse.slice(0, mIdx + 1);
    } else if (cumulativeRangeTab === 'last12') {
      seriesToUse = currentYearPoints;
    }

    if (cumulativeUpToMonth !== 'ALL') {
      const targetIdx = seriesToUse.findIndex((s) => s.monthKey === cumulativeUpToMonth);
      if (targetIdx !== -1) {
        seriesToUse = seriesToUse.slice(0, targetIdx + 1);
      }
    }

    let running = 0;
    const points = seriesToUse.map((m: any, idx: number) => {
      const added = Number(m.grossRevenue || 0);
      running += added;
      return {
        ...m,
        monthAdded: added,
        cumulativeGross: running,
        index: idx,
      };
    });

    const total = running;
    const maxVal = Math.max(...points.map((p) => p.cumulativeGross), 1000) * 1.15;
    const avgMonthly = points.length > 0 ? total / points.length : 0;

    return { points, total, maxVal, avgMonthly };
  }, [monthlyDataMap, cumulativeRangeTab, cumulativeUpToMonth, defaultMonthKey, nowYear]);

  const dynamicLineGraphData = useMemo(() => {
    const yearPoints = [];
    for (let m = 0; m < 12; m++) {
      const mKey = `${lineGraphYear}-${String(m + 1).padStart(2, '0')}`;
      const mData = monthlyDataMap[mKey] || {
        grossMonthlyRevenue: 0,
        netProfit: 0,
        partnerCommissionOutflow: 0,
        totalOperatingExpenses: 0,
        monthName: `${monthNames[m]} ${lineGraphYear}`,
        monthLabel: monthShort[m],
      };
      yearPoints.push({
        monthKey: mKey,
        monthLabel: monthShort[m],
        monthName: `${monthNames[m]} ${lineGraphYear}`,
        monthIndex: m,
        grossRevenue: Number(mData.grossMonthlyRevenue || 0),
        netProfit: Number(mData.netProfit || 0),
        partnerOutflow: Number(mData.partnerCommissionOutflow || 0),
        expenses: Number(mData.totalOperatingExpenses || 0),
        isCurrent: mKey === defaultMonthKey,
      });
    }

    let sliced = [...yearPoints];
    if (lineGraphTimeframe === 'ytd') {
      const parts = defaultMonthKey.split('-');
      const currentYearNum = parseInt(parts[0], 10);
      const mIdx = parseInt(parts[1], 10) - 1;
      if (lineGraphYear === currentYearNum) {
        sliced = sliced.slice(0, mIdx + 1);
      }
    } else if (lineGraphTimeframe === 'last6') {
      sliced = sliced.slice(6, 12);
    } else if (lineGraphTimeframe === 'q1') {
      sliced = sliced.slice(0, 3);
    } else if (lineGraphTimeframe === 'q2') {
      sliced = sliced.slice(3, 6);
    } else if (lineGraphTimeframe === 'q3') {
      sliced = sliced.slice(6, 9);
    } else if (lineGraphTimeframe === 'q4') {
      sliced = sliced.slice(9, 12);
    }

    const points = sliced.map((m, idx) => {
      let val = m.grossRevenue;
      if (lineGraphMetric === 'netProfit') val = m.netProfit;
      if (lineGraphMetric === 'partnerOutflow') val = m.partnerOutflow;

      return {
        ...m,
        index: idx,
        value: val,
        isFocused: lineGraphFocusMonth !== 'ALL' && m.monthKey === lineGraphFocusMonth,
      };
    });

    const allValues =
      lineGraphMetric === 'compareAll'
        ? points.flatMap((p) => [p.grossRevenue, p.netProfit, p.partnerOutflow])
        : points.map((p) => p.value);

    const maxVal = Math.max(...allValues.map((v) => Math.abs(v)), 500) * 1.25;
    const minVal = Math.min(...allValues, 0);

    const totalPeriodRevenue = points.reduce((s, p) => s + p.grossRevenue, 0);
    const avgRevenue = points.length > 0 ? totalPeriodRevenue / points.length : 0;
    const peakPoint = points.reduce(
      (prev, curr) => (curr.grossRevenue > prev.grossRevenue ? curr : prev),
      points[0] || { monthName: '-', grossRevenue: 0 }
    );

    return { points, maxVal, minVal, totalPeriodRevenue, avgRevenue, peakPoint };
  }, [lineGraphYear, lineGraphTimeframe, lineGraphMetric, lineGraphFocusMonth, monthlyDataMap, defaultMonthKey]);

  const focusedLineMonthData = useMemo(() => {
    if (lineGraphFocusMonth === 'ALL') return null;
    return monthlyDataMap[lineGraphFocusMonth] || null;
  }, [lineGraphFocusMonth, monthlyDataMap]);

  const maxWaterfallVal = useMemo(() => {
    const allVals = waterfallItems.map((d: any) => Math.abs(Number(d.value || 0)));
    return Math.max(...allVals, 500) * 1.15;
  }, [waterfallItems]);

  const maxBridgeVal = useMemo(() => {
    const allVals = bridgeItems.map((d: any) => Math.abs(Number(d.value || 0)));
    return Math.max(...allVals, 500) * 1.15;
  }, [bridgeItems]);

  return (
    <>
      <FinancesCoreKpiCards
        availableMonths={availableMonths}
        gmrMonth={gmrMonth}
        setGmrMonth={setGmrMonth}
        revAddedMonth={revAddedMonth}
        setRevAddedMonth={setRevAddedMonth}
        partnerOutflowMonth={partnerOutflowMonth}
        setPartnerOutflowMonth={setPartnerOutflowMonth}
        nrvMonth={nrvMonth}
        setNrvMonth={setNrvMonth}
        netProfitMonth={netProfitMonth}
        setNetProfitMonth={setNetProfitMonth}
        expensesMonth={expensesMonth}
        setExpensesMonth={setExpensesMonth}
        arrMonth={arrMonth}
        setArrMonth={setArrMonth}
        cumulativeYtd={cumulativeYtd}
        setCumulativeYtd={setCumulativeYtd}
        gmrData={gmrData}
        revAddedData={revAddedData}
        partnerOutflowData={partnerOutflowData}
        nrvData={nrvData}
        netProfitData={netProfitData}
        expensesData={expensesData}
        arrData={arrData}
        realYtdProfit={realYtdProfit}
        sparklinePoints={sparklinePoints}
      />

      <FinancesWaterfallAndBridge
        waterfallMonth={waterfallMonth}
        setWaterfallMonth={setWaterfallMonth}
        waterfallItems={waterfallItems}
        maxWaterfallVal={maxWaterfallVal}
        bridgeMonth={bridgeMonth}
        setBridgeMonth={setBridgeMonth}
        bridgeItems={bridgeItems}
        maxBridgeVal={maxBridgeVal}
        availableMonths={availableMonths}
      />

      <FinancesGmrAndAreaCharts
        barChartYear={barChartYear}
        setBarChartYear={setBarChartYear}
        gmrCompareYoY={gmrCompareYoY}
        setGmrCompareYoY={setGmrCompareYoY}
        barChartSeriesData={barChartSeriesData}
        dynamicCumulativeData={dynamicCumulativeData}
        cumulativeRangeTab={cumulativeRangeTab}
        setCumulativeRangeTab={setCumulativeRangeTab}
        cumulativeUpToMonth={cumulativeUpToMonth}
        setCumulativeUpToMonth={setCumulativeUpToMonth}
        activeHoverCumIdx={activeHoverCumIdx}
        setActiveHoverCumIdx={setActiveHoverCumIdx}
        availableMonths={availableMonths}
        nowYear={nowYear}
      />

      <FinancesTrajectoryLineGraph
        lineGraphYear={lineGraphYear}
        setLineGraphYear={setLineGraphYear}
        lineGraphTimeframe={lineGraphTimeframe}
        setLineGraphTimeframe={setLineGraphTimeframe}
        lineGraphMetric={lineGraphMetric}
        setLineGraphMetric={setLineGraphMetric}
        lineGraphFocusMonth={lineGraphFocusMonth}
        setLineGraphFocusMonth={setLineGraphFocusMonth}
        activeHoverLineIdx={activeHoverLineIdx}
        setActiveHoverLineIdx={setActiveHoverLineIdx}
        dynamicLineGraphData={dynamicLineGraphData}
        focusedLineMonthData={focusedLineMonthData}
        availableMonths={availableMonths}
        nowYear={nowYear}
      />
    </>
  );
}
