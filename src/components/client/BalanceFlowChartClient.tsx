"use client";
import dynamic from "next/dynamic";

const BalanceFlowChart = dynamic(() => import("../BalanceFlowChart"), { ssr: false });

export default function BalanceFlowChartClient(props: any) {
  return <BalanceFlowChart {...props} />;
} 