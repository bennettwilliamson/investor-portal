"use client";
import dynamic from "next/dynamic";

// Dynamic import wrapper that disables SSR because Recharts accesses the browser DOM API.
const BalanceFlowChart = dynamic(() => import("../BalanceFlowChart"), {
    ssr: false,
});

export default BalanceFlowChart; 