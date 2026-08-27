import asyncio
import time
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_full_verification():
    print("=== Starting Full E2E Real Measurement Verification ===")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Health check
        print("\n1. Testing Health Endpoint...")
        res = await client.get(f"{BASE_URL}/health")
        assert res.status_code == 200, f"Health check failed: {res.status_code}"
        print("[OK] Health Check Passed:", res.json())

        # 2. Server Registry & Health
        print("\n2. Testing Server Registry...")
        res = await client.get(f"{BASE_URL}/api/servers")
        assert res.status_code == 200
        servers = res.json()
        assert len(servers) > 0
        print(f"[OK] Found {len(servers)} registered servers.")

        # 3. Latency Ping Probes
        print("\n3. Running Real Latency Probes (10 probes)...")
        rtts = []
        for i in range(10):
            t0 = time.perf_counter()
            res = await client.get(f"{BASE_URL}/api/speedtest/ping?echo={i}")
            assert res.status_code == 200
            rtt = (time.perf_counter() - t0) * 1000.0
            rtts.append(rtt)
        
        min_rtt = min(rtts)
        median_rtt = sorted(rtts)[len(rtts) // 2]
        avg_rtt = sum(rtts) / len(rtts)
        max_rtt = max(rtts)
        jitter = sum(abs(rtts[i+1] - rtts[i]) for i in range(len(rtts)-1)) / (len(rtts)-1)
        print(f"[OK] Latency Results: Min={min_rtt:.2f}ms, Median={median_rtt:.2f}ms, Avg={avg_rtt:.2f}ms, Max={max_rtt:.2f}ms, Jitter={jitter:.2f}ms")

        # 4. Real Download Stream Test
        print("\n4. Running Real Download Streaming (5MB transfer)...")
        t0 = time.perf_counter()
        dl_res = await client.get(f"{BASE_URL}/api/speedtest/download?size_mb=5&chunk_kb=256")
        assert dl_res.status_code == 200
        total_dl_bytes = len(dl_res.content)
        dl_duration = time.perf_counter() - t0
        dl_mbps = (total_dl_bytes * 8.0) / dl_duration / 1_000_000.0
        print(f"[OK] Download Complete: {total_dl_bytes} bytes received in {dl_duration:.3f}s -> {dl_mbps:.2f} Mbps")

        # 5. Real Upload Stream Test
        print("\n5. Running Real Upload Streaming (5MB payload)...")
        payload = b"U" * (5 * 1024 * 1024)
        t0 = time.perf_counter()
        ul_res = await client.post(f"{BASE_URL}/api/speedtest/upload", content=payload)
        assert ul_res.status_code == 200
        ul_data = ul_res.json()
        print(f"[OK] Upload Complete: {ul_data['bytes_received']} bytes received & discarded by server at {ul_data['mbps']:.2f} Mbps")

        # 6. Save Test Result in Database
        print("\n6. Recording Test in Database (Privacy Hash Test)...")
        test_payload = {
            "server_id": servers[0]["id"],
            "server_name": servers[0]["name"],
            "download_mbps": round(dl_mbps, 2),
            "upload_mbps": round(ul_data["mbps"], 2),
            "latency_ms": round(median_rtt, 2),
            "latency_min_ms": round(min_rtt, 2),
            "latency_max_ms": round(max_rtt, 2),
            "latency_avg_ms": round(avg_rtt, 2),
            "jitter_ms": round(jitter, 2),
            "http_failure_rate": 0.0,
            "stability_score": 94.5,
            "overall_score": 92.0,
            "speed_score": 90.0,
            "latency_score": 95.0,
            "duration": round(dl_duration + ul_data["duration_seconds"], 2),
            "bytes_downloaded": total_dl_bytes,
            "bytes_uploaded": len(payload),
            "test_mode": "full"
        }
        rec_res = await client.post(f"{BASE_URL}/api/tests", json=test_payload)
        assert rec_res.status_code == 200
        saved_record = rec_res.json()
        print("[OK] Test Recorded:", saved_record["id"], f"Download: {saved_record['download_mbps']} Mbps")

        # 7. Query Analytics
        print("\n7. Testing Analytics Aggregation...")
        an_res = await client.get(f"{BASE_URL}/api/tests/analytics")
        assert an_res.status_code == 200
        an_data = an_res.json()
        assert an_data["records"]["fastest_download"] is not None
        print("[OK] Analytics Records:", an_data["records"])

        # 8. Diagnostic Engine & AI Doctor
        print("\n8. Testing Network Diagnostics Engine...")
        diag_res = await client.post(
            f"{BASE_URL}/api/diagnostics/evaluate?download_mbps={dl_mbps}&upload_mbps={ul_data['mbps']}&latency_ms={median_rtt}&jitter_ms={jitter}&stability_score=94.5"
        )
        assert diag_res.status_code == 200
        diag_report = diag_res.json()
        print(f"[OK] Diagnostic Report: Status={diag_report['overall_status']}, Profile={diag_report['connection_type_estimate']}")

        # 9. Admin Metrics
        print("\n9. Testing Admin Dashboard Protected Metrics...")
        admin_res = await client.get(
            f"{BASE_URL}/api/admin/metrics",
            headers={"X-Admin-Key": "netscope-admin-secret-key-2026"}
        )
        assert admin_res.status_code == 200
        admin_data = admin_res.json()
        print(f"[OK] Admin Telemetry: Total Tests={admin_data['total_tests_completed']}, Memory={admin_data['system']['memory_used_mb']}MB")

        print("\n=======================================================")
        print("ALL REAL MEASUREMENT & BACKEND PIPELINES PASSED 100%!")
        print("=======================================================")

if __name__ == "__main__":
    asyncio.run(run_full_verification())
