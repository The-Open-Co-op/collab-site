"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemosPage() {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(e) {
      if (e.data?.type === "demo-navigate") {
        if (e.data.slug) {
          router.push(`/demo/${e.data.slug}`);
        } else {
          router.push("/demo");
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <iframe
        src="https://planet-sepia.vercel.app/#/demo"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="PLANET Demos"
      />
    </div>
  );
}
