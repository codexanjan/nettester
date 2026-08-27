import time
from typing import List, Dict, Any, Optional
from app.schemas.diagnostics import DiagnosticItem, DiagnosticReport

def evaluate_network_diagnostics(
    download_mbps: float,
    upload_mbps: float,
    latency_ms: float,
    jitter_ms: float,
    stability_score: float,
    http_failure_rate: float = 0.0
) -> DiagnosticReport:
    """
    Rules-based diagnostic engine that inspects real measurement samples.
    Always qualifies conclusions as 'Possible causes' rather than pretending certainty.
    """
    items: List[DiagnosticItem] = []
    
    # 1. Download & Upload Throughput Evaluation
    if download_mbps >= 200.0:
        items.append(DiagnosticItem(
            category="speed",
            severity="success",
            title="High-Speed Gigabit/Broadband Tier",
            description=f"Your measured download speed of {download_mbps:.1f} Mbps provides abundant bandwidth for multi-user heavy tasks.",
            possible_causes=["Fiber to the Home (FTTH)", "High-tier DOCSIS cable or gigabit plan"],
            recommendations=["No action needed for bandwidth-intensive activities."]
        ))
    elif download_mbps >= 50.0:
        items.append(DiagnosticItem(
            category="speed",
            severity="info",
            title="Standard Broadband Speed",
            description=f"Download speed of {download_mbps:.1f} Mbps is suitable for HD/4K video streaming and simultaneous home devices.",
            possible_causes=["Standard broadband connection tier", "Healthy local Wi-Fi link"],
            recommendations=["Sufficient for everyday multi-device usage."]
        ))
    elif download_mbps >= 15.0:
        items.append(DiagnosticItem(
            category="speed",
            severity="warning",
            title="Moderate Bandwidth Limitation",
            description=f"Download speed of {download_mbps:.1f} Mbps may experience slowdowns if multiple users stream or download large files at once.",
            possible_causes=["Entry-level plan", "Weak Wi-Fi signal/interference", "Network congestion"],
            recommendations=["Move closer to the router or consider wired Ethernet connection.", "Check for active background downloads on other devices."]
        ))
    else:
        items.append(DiagnosticItem(
            category="speed",
            severity="critical",
            title="Low Bandwidth Bottleneck",
            description=f"Download speed of {download_mbps:.1f} Mbps is constrained and will cause buffering on HD video or large transfers.",
            possible_causes=["Severe local Wi-Fi attenuation", "Bandwidth throttling or network congestion", "Low ISP service tier"],
            recommendations=["Restart your modem/router.", "Verify Ethernet cable link speed.", "Contact ISP if subscribed plan is significantly higher."]
        ))
        
    # Asymmetric Upload Check
    if download_mbps > 50.0 and upload_mbps < (download_mbps * 0.1):
        items.append(DiagnosticItem(
            category="speed",
            severity="info",
            title="Asymmetric Connection Detected",
            description=f"Upload speed ({upload_mbps:.1f} Mbps) is significantly lower than download speed ({download_mbps:.1f} Mbps).",
            possible_causes=["Standard Cable/VDSL asymmetric provisioning (normal for non-fiber plans)"],
            recommendations=["Normal behavior for cable internet; note that large file backups or live streaming may be bounded by upload speed."]
        ))

    # 2. Latency Analysis
    if latency_ms <= 20.0:
        items.append(DiagnosticItem(
            category="latency",
            severity="success",
            title="Ultra-Low Latency",
            description=f"Round-trip latency of {latency_ms:.1f} ms delivers immediate responsiveness.",
            possible_causes=["Close geographical proximity to edge test server", "Low network queue buffering", "Fiber/Ethernet routing"],
            recommendations=["Ideal for real-time multiplayer gaming, cloud desktops, and competitive trading."]
        ))
    elif latency_ms <= 60.0:
        items.append(DiagnosticItem(
            category="latency",
            severity="info",
            title="Good Latency",
            description=f"Latency of {latency_ms:.1f} ms is normal and suitable for standard VoIP calls, web browsing, and casual gaming.",
            possible_causes=["Regional server routing", "Standard broadband routing hops"],
            recommendations=["No action needed for regular internet activities."]
        ))
    elif latency_ms <= 120.0:
        items.append(DiagnosticItem(
            category="latency",
            severity="warning",
            title="Elevated Latency",
            description=f"Latency of {latency_ms:.1f} ms may introduce slight delays in voice calls or fast-paced interactive apps.",
            possible_causes=["Geographically distant test server", "Intermediate ISP routing congestion", "Wi-Fi channel congestion"],
            recommendations=["Select a test server closer to your geographical region.", "Switch to a 5GHz Wi-Fi band or Ethernet cable."]
        ))
    else:
        items.append(DiagnosticItem(
            category="latency",
            severity="critical",
            title="High Latency / Ping Delay",
            description=f"Latency of {latency_ms:.1f} ms will cause noticeable lag in voice/video calls and interactive applications.",
            possible_causes=["Satellite or cellular (4G/LTE) backhaul", "Severe bufferbloat or routing loop", "VPN / Proxy routing through distant countries"],
            recommendations=["Disconnect any active VPN or proxy to test direct route.", "Check router bufferbloat management (SQM/QoS)."]
        ))

    # 3. Jitter & Stability
    if jitter_ms > 15.0:
        items.append(DiagnosticItem(
            category="jitter",
            severity="warning",
            title="Elevated Latency Variation (Jitter)",
            description=f"Measured jitter of {jitter_ms:.1f} ms indicates inconsistent packet delivery times.",
            possible_causes=["Wi-Fi radio interference", "Local network contention (bufferbloat)", "ISP routing instability"],
            recommendations=["Test with a wired Ethernet cable to isolate Wi-Fi interference.", "Pause competing video streams or downloads during sensitive calls."]
        ))
        
    if stability_score < 70.0:
        items.append(DiagnosticItem(
            category="stability",
            severity="warning",
            title="Fluctuating Throughput Stability",
            description=f"Stability score of {stability_score:.1f}% indicates throughput drops or latency spikes occurred during testing.",
            possible_causes=["Concurrent bandwidth usage on local network", "Dynamic frequency scaling on wireless channel", "ISP burst capping"],
            recommendations=["Ensure no background downloads/updates are active while testing."]
        ))

    # 4. HTTP Failure Rate
    if http_failure_rate > 0.0:
        items.append(DiagnosticItem(
            category="general",
            severity="critical",
            title="HTTP Probe Failures Detected",
            description=f"{http_failure_rate:.1f}% of network test probes failed to complete.",
            possible_causes=["Packet drops or transient socket drops", "Firewall / security software interference", "Severe wireless packet loss"],
            recommendations=["Inspect router logs for dropouts.", "Verify that local security software isn't interrupting test streams."]
        ))

    # Overall Status Calculation
    if http_failure_rate > 5.0 or latency_ms > 150.0 or download_mbps < 5.0:
        overall_status = "Degraded"
    elif stability_score < 65.0 or jitter_ms > 25.0:
        overall_status = "Unstable"
    elif download_mbps >= 100.0 and latency_ms <= 30.0 and jitter_ms <= 5.0:
        overall_status = "Excellent"
    elif download_mbps >= 30.0 and latency_ms <= 70.0:
        overall_status = "Good"
    else:
        overall_status = "Fair"

    # Connection estimate
    if latency_ms <= 12.0 and download_mbps >= 150.0:
        conn_estimate = "Likely Fiber (FTTH) / High-speed Direct Line"
    elif latency_ms <= 35.0:
        conn_estimate = "Likely Cable Broadband (DOCSIS) / VDSL"
    elif latency_ms <= 80.0:
        conn_estimate = "Likely Fixed Wireless / 5G Home Internet / Standard DSL"
    else:
        conn_estimate = "Likely Cellular (4G/LTE) / Satellite or Long-Haul Route"

    return DiagnosticReport(
        overall_status=overall_status,
        connection_type_estimate=conn_estimate,
        items=items,
        metrics_summary={
            "download_mbps": download_mbps,
            "upload_mbps": upload_mbps,
            "latency_ms": latency_ms,
            "jitter_ms": jitter_ms,
            "stability_score": stability_score,
            "http_failure_rate": http_failure_rate
        },
        timestamp=time.time()
    )
