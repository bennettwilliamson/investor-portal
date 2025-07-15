"use client";
import dynamic from "next/dynamic";

const ReturnCombo = dynamic(() => import("../ReturnCombo"), { ssr: false });

export default function ReturnComboClient(props: any) {
  return <ReturnCombo {...props} />;
} 