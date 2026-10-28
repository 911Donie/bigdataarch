import time
from typing import Dict, Any, List, Optional
from app.stream_engine import stream_engine
from app.generator import generator
from app.congestion_engine import congestion_engine
from app.anomaly_detector import anomaly_detector
from app.config import settings

class LearningAndExplainabilityEngine:
    def explain_metric(self, metric_id: str) -> Dict[str, Any]:
        """
        Returns structured 5-part explanation for any dashboard metric,
        dynamically injecting live values from the current simulation.
        """
        m = stream_engine.compute_window_metrics(30)
        scenario = generator.active_scenario
        zones = congestion_engine.evaluate_zones(10)
        congested_zones = [z["zone_id"] for z in zones if z["status"] in ["CONGESTED", "CRITICAL"]]
        
        explanations = {
            "sms_failure_rate": {
                "title": "SMS Delivery Failure Rate (%)",
                "what_is_it": "The percentage of SMS message dispatch attempts that failed to reach delivery confirmation within the selected window.",
                "why_it_matters": "High SMS failure rates directly degrade user experience (e.g., missed banking OTPs, two-factor authentication codes, critical alerts) and often signal downstream SMSC queue saturation, carrier routing failures, or retry amplification.",
                "how_calculated": f"Calculated as: (Failed SMS Delivery Attempts / Total SMS Delivery Attempts) × 100 over the active window ({m['window_duration_s']}s). Currently: ({m['sms_failed']} failed / {m['sms_count']} total) × 100 = {m['sms_failure_rate']}%.",
                "current_simulation_state": f"The failure rate is currently {m['sms_failure_rate']}%. In the '{scenario}' scenario, {m['sms_failed']} messages failed out of {m['sms_count']} attempts in the last 30s. Baseline nominal rate is < 2.0%.",
                "operator_next_steps": "Investigate SMSC error codes (e.g. CONGESTION_TIMEOUT vs UNREACHABLE), inspect downstream SMPP bind connections, check queue growth, and enforce retry backoff to avoid cascading retry storms."
            },
            "call_failure_rate": {
                "title": "Voice Call Failure Rate (%)",
                "what_is_it": "The proportion of initiated voice calls that failed to establish a circuit or SIP signaling session.",
                "why_it_matters": "Voice calls have strict real-time Quality of Service (QoS) requirements. Failures indicate trunk saturation, lack of radio resource channels, or core network signaling exhaustion.",
                "how_calculated": f"Calculated as: (Failed Call Attempts / Total Call Attempts) × 100. Currently: ({m['voice_failed']} failed / {m['voice_count']} attempts) × 100 = {m['call_failure_rate']}%.",
                "current_simulation_state": f"Voice failure rate is {m['call_failure_rate']}%. Under scenario '{scenario}', {m['voice_failed']} calls failed out of {m['voice_count']} attempts.",
                "operator_next_steps": "Examine SS7/ISUP or SIP signaling response codes (e.g., 503 Service Unavailable, 486 Busy Here), check inter-carrier trunk utilization, and prioritize signaling traffic."
            },
            "current_throughput_eps": {
                "title": "Current Traffic Throughput (Events/Sec)",
                "what_is_it": "The rate of telecom events arriving and being ingested into the processing engine per second.",
                "why_it_matters": "Throughput reflects instantaneous network demand. Rapid swings indicate surges, traffic migrations, or distributed anomalies.",
                "how_calculated": f"Calculated as: Total events processed in window / Window duration in seconds. Currently: {m['total_events']} events / {m['window_duration_s']}s = {m['throughput_eps']} eps.",
                "current_simulation_state": f"Throughput is running at {m['throughput_eps']} eps (nominal baseline is ~35-45 eps). Under scenario '{scenario}', ingestion rate is {generator.rate_eps} eps.",
                "operator_next_steps": "Compare current throughput with historical rolling baseline; check if backend ingestion clusters (Kafka/Flink) have adequate consumer group lag headroom."
            },
            "avg_sms_latency": {
                "title": "Average SMS Delivery Latency (ms)",
                "what_is_it": "The average round-trip duration from initial SMS submission to delivery receipt acknowledgment.",
                "why_it_matters": "Latency is a leading indicator of queuing delays. Latency spikes precede hard failures when buffers fill up.",
                "how_calculated": f"Calculated as: Sum of delivery latency for delivered SMS / Total delivered SMS. Currently: {m['avg_sms_latency_ms']} ms.",
                "current_simulation_state": f"Average latency is {m['avg_sms_latency_ms']} ms. Normal operational range is 80-140 ms. Queue backlog is currently {m['queue_backlog']} events.",
                "operator_next_steps": "Check queue depth at edge nodes and message brokers; verify consumer worker thread count and throttle non-essential bulk traffic."
            },
            "dropped_call_rate": {
                "title": "Dropped Call Rate (%)",
                "what_is_it": "The percentage of successfully established calls that were unexpectedly terminated before subscriber hangup.",
                "why_it_matters": "A core telecom Key Performance Indicator (KPI) heavily scrutinized by telecommunications regulatory authorities. High drops indicate radio interference or handoff failures.",
                "how_calculated": f"Calculated as: Dropped Voice Calls / Total Connected Voice Calls × 100. Currently: {m['dropped_call_rate']}%.",
                "current_simulation_state": f"Dropped call rate is {m['dropped_call_rate']}%. Dropped count: {m['voice_dropped']} out of {m['voice_count']} calls.",
                "operator_next_steps": "Inspect handover failure rates between neighboring cell towers, check RF signal-to-noise ratios, and review backhaul packet loss."
            },
            "network_utilization": {
                "title": "Network Zone Utilization (%)",
                "what_is_it": "The ratio of instantaneous traffic load to the provisioned processing capacity for a network zone.",
                "why_it_matters": "Determines how close a network element is to its saturation cliff. Over 85% utilization creates non-linear queuing delays.",
                "how_calculated": "Calculated as: (Current Traffic Load in eps / Configured Zone Capacity in eps) × 100.",
                "current_simulation_state": f"Active zones under stress: {', '.join(congested_zones) if congested_zones else 'None (All zones within safe margins)'}.",
                "operator_next_steps": "Trigger dynamic rerouting to adjacent zones with spare capacity, or spin up additional containerized processing workers."
            }
        }
        
        fallback = {
            "title": f"Metric: {metric_id}",
            "what_is_it": "A real-time operational telecommunications telemetry parameter.",
            "why_it_matters": "Provides continuous visibility into traffic patterns and network health.",
            "how_calculated": "Aggregated from bounded streaming window event timestamps.",
            "current_simulation_state": f"Current system throughput is {m['throughput_eps']} eps across {len(settings.REGIONS)} regions.",
            "operator_next_steps": "Monitor rolling trends against 5-minute historical baselines."
        }
        
        return explanations.get(metric_id, fallback)

    def answer_ask_why(self, question_key: str) -> Dict[str, Any]:
        """
        Dynamically answers user inquiries using the current simulation context.
        """
        m = stream_engine.compute_window_metrics(30)
        scenario = generator.active_scenario
        zones = congestion_engine.evaluate_zones(10)
        anomalies = anomaly_detector.get_recent_anomalies(5)
        
        answers = {
            "why_traffic_increased": {
                "question": "Why did traffic suddenly increase?",
                "direct_answer": f"The system is currently running under scenario '{scenario}' with an event injection rate of {generator.rate_eps} eps (current measured throughput: {m['throughput_eps']} eps).",
                "evidence_from_run": f"Total events in 30s window reached {m['total_events']} (SMS: {m['sms_count']}, Voice: {m['voice_count']}). Compared to the normal ~35 eps baseline, this represents a {round((m['throughput_eps'] - 35) / 35 * 100, 1)}% variance.",
                "technical_explanation": "In real networks, traffic surges occur during flash-crowd events (e.g. sporting events, breaking news, new year midnight bursts) or automated bulk messaging blasts. In this project, the real-time event generator simulates this by dialing up ingestion rates across specific Poisson arrival distributions."
            },
            "why_zone_critical": {
                "question": "Why is this network zone marked critical or congested?",
                "direct_answer": "A zone transitions to CRITICAL or CONGESTED only when high utilization is compounded by observable service degradation (latency increase, queue buildup, or failure rates).",
                "evidence_from_run": f"Examining current zone evaluations: {len([z for z in zones if z['status'] in ['CONGESTED', 'CRITICAL']])} zones are congested. South-02 utilization is currently monitored with queue length {m['queue_backlog']}.",
                "technical_explanation": "Crucial distinction: High utilization alone triggers 'High utilization — monitor' (Warning). It only becomes 'Congested' when queuing delays (SMS latency > 250ms) or call drops (>5%) prove that capacity constraints are actively damaging subscriber QoS."
            },
            "what_kafka_does": {
                "question": "What does Apache Kafka do in this architecture?",
                "direct_answer": "Apache Kafka acts as a distributed, fault-tolerant append-only message log that decouples high-speed telecom event producers (cell towers, SMSCs) from downstream processing consumers.",
                "evidence_from_run": f"Current stream ingestion is buffering {generator.total_generated} generated events. In local simulation mode, this is handled by a bounded, partitioned memory queue honoring the same FIFO and consumer group semantics.",
                "technical_explanation": "Kafka handles millions of events per second with sub-millisecond write latency. It prevents backpressure from crushing backend databases by allowing consumers to process events at their own pace."
            },
            "why_need_spark": {
                "question": "Why do we need Apache Spark / Stream Processing?",
                "direct_answer": "Traditional relational databases cannot run complex multi-dimensional sliding window aggregations and anomaly detection across millions of records per second without locking up.",
                "evidence_from_run": f"The engine is currently calculating rolling 10s, 30s, 60s, and 300s window aggregations ({m['total_events']} events) continuously every second without database bottlenecks.",
                "technical_explanation": "Spark Structured Streaming provides micro-batch and continuous processing with exactly-once fault-tolerance, stateful watermarking for out-of-order data, and distributed parallel execution across cluster nodes."
            },
            "how_failure_rate_calculated": {
                "question": "How is the failure rate calculated?",
                "direct_answer": f"Formula: Failure Rate = (Failed Events / Total Attempted Events) × 100 within the active sliding time window.",
                "evidence_from_run": f"In the current 30s window: SMS Failure Rate = ({m['sms_failed']} / {m['sms_count']}) × 100 = {m['sms_failure_rate']}%. Call Failure Rate = ({m['voice_failed']} / {m['voice_count']}) × 100 = {m['call_failure_rate']}%.",
                "technical_explanation": "Calculations use true event timestamps (event-time semantics) rather than arrival time, ensuring late-arriving events are assigned to their correct window."
            },
            "difference_spike_vs_congestion": {
                "question": "What is the difference between a traffic spike and congestion?",
                "direct_answer": "A traffic spike is an unusual increase in subscriber demand. Congestion is a condition where network resource constraints impair service performance.",
                "evidence_from_run": f"Current throughput is {m['throughput_eps']} eps. A spike does NOT automatically mean congestion if network capacity is sufficient to handle the load without dropping packets or increasing queue delays.",
                "technical_explanation": "If traffic surges from 40 eps to 100 eps on a 200 eps capacity zone, utilization is 50%, latency remains ~90ms, and failure rate is 0.8% — this is a SPIKE, NOT congestion. It only becomes congestion when load exceeds capacity and causes queue backlog and packet drop."
            },
            "why_big_data_telecom": {
                "question": "How does Big Data specifically help a telecom operator?",
                "direct_answer": "Telecom operators process tens of billions of Call Detail Records (CDRs) and signaling packets daily. Big Data enables proactive automated remediation instead of reactive customer complaints.",
                "evidence_from_run": f"The system detected anomalies across {len(anomalies)} events in real time and recommended automated mitigations (traffic rerouting, capacity expansion).",
                "technical_explanation": "Demonstrates the 5 Vs: Volume (billions of CDRs), Velocity (real-time stream processing), Variety (SMS, Voice, Data schemas), Veracity (handling duplicate/late packets), and Value (protecting SLA compliance and revenue)."
            },
            "what_if_traffic_doubles": {
                "question": "What would happen if traffic doubled?",
                "direct_answer": f"If current traffic ({m['throughput_eps']} eps) doubled to {round(m['throughput_eps'] * 2, 1)} eps, zones operating above 50% capacity would breach the 85% critical threshold.",
                "evidence_from_run": f"Specifically, zones like South-02 (base capacity 100 eps) would experience queue growth from {m['queue_backlog']} to over 250 events, causing SMS latency to climb from {m['avg_sms_latency_ms']} ms to >600 ms.",
                "technical_explanation": "Queuing theory (M/M/1 queuing model) dictates that as utilization approaches 100%, queue wait time increases asymptotically towards infinity unless dynamic autoscaling or traffic shedding is activated."
            }
        }
        
        return answers.get(question_key, {
            "question": "General System Query",
            "direct_answer": f"Currently operating in {settings.STREAMING_MODE} mode under scenario {scenario}.",
            "evidence_from_run": f"Current throughput: {m['throughput_eps']} eps. Total processed: {generator.total_processed}.",
            "technical_explanation": "All metrics are computed live from processed streaming events."
        })

    def get_viva_qna(self) -> List[Dict[str, Any]]:
        """
        Comprehensive Viva / Jury questions and technical answers.
        """
        return [
            {
                "id": 1,
                "question": "Why is this a Big Data project?",
                "short_answer": "Because telecom networks generate continuous massive streams of semi-structured events with high velocity and volume that exceed standard relational database limits.",
                "technical_answer": "Telecom systems generate millions of signaling packets and CDRs per second (Velocity), accumulating petabytes per week (Volume), across distinct formats like SS7/SIP/SMPP (Variety), with network jitter and packet loss (Veracity), processed to prevent outages (Value). This project implements the complete ingest-process-detect-act pipeline.",
                "current_run_example": f"Currently ingesting and windowing {generator.total_processed} events at {generator.rate_eps} events/sec without database write bottlenecks."
            },
            {
                "id": 2,
                "question": "Why can't we simply use a normal database?",
                "short_answer": "Relational databases cannot handle sustained hundreds of thousands of concurrent writes and rolling multi-window aggregations without index contention and locking.",
                "technical_answer": "Writing every event directly to an RDBMS creates I/O bottlenecks and lock contention. Stream processing engines process events in-memory as they fly by, and only persist aggregated summaries and critical alerts to the database.",
                "current_run_example": "Events are aggregated in rolling 10s/30s/60s in-memory windows; only aggregated snapshots are committed to SQLite/PostgreSQL."
            },
            {
                "id": 3,
                "question": "What is stream processing?",
                "short_answer": "The paradigm of processing data records continuously one-by-one or in micro-batches with minimal latency as soon as they are generated.",
                "technical_answer": "Unlike batch processing which waits for files to land on disk (e.g. nightly ETL), stream processing operates on unbounded data streams, maintaining sliding state windows and watermarks to compute metrics within seconds of event occurrence.",
                "current_run_example": f"Window metrics refresh every second, giving operators sub-second visibility into traffic changes."
            },
            {
                "id": 4,
                "question": "What is Apache Kafka?",
                "short_answer": "A distributed event streaming platform used for high-throughput, fault-tolerant publish-subscribe messaging.",
                "technical_answer": "Kafka organizes events into partitioned, replicated append-only topics. Producers write events to partitions, and consumer groups read from partitions independently, providing backpressure buffering and horizontal scalability.",
                "current_run_example": "In our architecture, the Telecom Generator acts as the Kafka Producer, publishing to 'sms-events' and 'voice-events' topics."
            },
            {
                "id": 5,
                "question": "What is Apache Spark Structured Streaming?",
                "short_answer": "A scalable and fault-tolerant stream processing engine built on the Spark SQL engine.",
                "technical_answer": "It provides declarative DataFrame APIs over streaming data, treating the stream as an unbounded table that is continuously appended. It natively supports event-time processing, late data handling via watermarking, and checkpointing for exactly-once guarantees.",
                "current_run_example": "Windowed metrics in our stream engine emulate Spark's sliding window semantics (e.g., window(timestamp, '30 seconds', '5 seconds'))."
            },
            {
                "id": 6,
                "question": "Why do we need a message broker?",
                "short_answer": "To decouple producers from consumers, buffer bursts of traffic, and prevent consumer crashes from affecting producers.",
                "technical_answer": "A message broker absorbs sudden traffic spikes (acting as an elastic shock absorber), allows multiple independent consumer services (analytics, billing, fraud detection) to read the same stream, and preserves event ordering within partitions.",
                "current_run_example": "During the 'SMS Spike' scenario, the ingestion queue absorbs the 120 eps burst without dropping incoming messages."
            },
            {
                "id": 7,
                "question": "What is the difference between batch and stream processing?",
                "short_answer": "Batch processes bounded historical data in large chunks with higher latency; stream processes unbounded continuous data in real time with low latency.",
                "technical_answer": "Batch (e.g. Hadoop MapReduce, Spark Batch) is optimized for high throughput across static data at rest. Stream (e.g. Flink, Spark Streaming) is optimized for low latency across dynamic data in motion.",
                "current_run_example": "The live dashboard uses stream processing for immediate congestion detection; the Historical Analytics page uses batch SQL queries."
            },
            {
                "id": 8,
                "question": "What is a traffic spike?",
                "short_answer": "A sudden, sharp increase in incoming message or call request volume.",
                "technical_answer": "A surge in subscriber demand, often caused by holidays, flash sales, disaster notifications, or viral social events. A spike tests whether the network can absorb load without degradation.",
                "current_run_example": f"Triggering 'SMS Traffic Spike' elevates throughput from 40 eps to {generator.rate_eps} eps."
            },
            {
                "id": 9,
                "question": "What is network congestion?",
                "short_answer": "A condition where traffic demand exceeds available network capacity, resulting in queuing delays, dropped calls, or failed deliveries.",
                "technical_answer": "Unlike a benign spike, congestion manifests as measurable Quality of Service (QoS) degradation: queue backlog growth, latency inflation, packet loss, and circuit setup failures.",
                "current_run_example": "South-02 zone entering CONGESTED status when utilization hits >90% and SMS latency exceeds 250ms."
            },
            {
                "id": 10,
                "question": "How is an anomaly detected?",
                "short_answer": "Through five complementary methods: Relative Spike, Statistical Z-Score, Failure-Rate thresholds, Queue Growth tracking, and Isolation Forest ML.",
                "technical_answer": "Method A checks multiples of baseline; Method B checks deviations from rolling mean (>2.5σ); Method C catches service failure spikes; Method D catches queue accumulation; Method E uses unsupervised tree isolation over 5D vectors.",
                "current_run_example": "Every detected anomaly clearly states which method triggered it and the exact statistical confidence score."
            },
            {
                "id": 11,
                "question": "How is SMS delivery failure rate calculated?",
                "short_answer": "(Failed SMS Delivery Attempts / Total SMS Delivery Attempts) × 100 in the current window.",
                "technical_answer": "The stream engine tracks SUBMITTED, DELIVERED, and FAILED status events within a bounded time window, calculating failed / (delivered + failed) * 100 based on actual event timestamps.",
                "current_run_example": f"Calculated live on the dashboard with full numerator, denominator, and window period displayed."
            },
            {
                "id": 12,
                "question": "How can operators respond to congestion?",
                "short_answer": "Dynamic traffic rerouting, auto-scaling capacity, edge rate admission limiting, prioritizing voice over SMS, and retry backoff.",
                "technical_answer": "Our Network Response Simulator provides interactive mitigation actions, measuring before-and-after KPIs to empirically prove whether the intervention relieved congestion.",
                "current_run_example": "Executing 'Dynamic Load Rerouting' shifts load from South-02 to South-01 and measures the utilization drop."
            },
            {
                "id": 13,
                "question": "Why are we using simulated data?",
                "short_answer": "Real telecom Call Detail Records (CDRs) are strictly private confidential subscriber data protected by telecommunications laws and GDPR.",
                "technical_answer": "Real CDRs contain sensitive personal data (caller phone numbers, cell tower GPS, timestamps). We use a mathematically rigorous simulation engine that generates realistic Poisson arrivals, Gaussian latencies, and telecom error codes while maintaining ethical transparency.",
                "current_run_example": "The application explicitly badges all data as simulated and labels the engine as 'Local Simulation Mode'."
            },
            {
                "id": 14,
                "question": "How can this system be connected to real telecom infrastructure?",
                "short_answer": "By connecting Kafka producers to real telecom network element interfaces like SMPP, Diameter, and SIP signaling taps.",
                "technical_answer": "In production, probes tap into GGSN/PGW interfaces, SMSCs forward SMPP delivery receipts to a Kafka cluster via Kafka Connect, and Spark Structured Streaming clusters consume the feeds with identical windowing logic.",
                "current_run_example": "The data schema mirrors 3GPP telecom standards (event_id, source_region, zone_id, status, latency_ms)."
            },
            {
                "id": 15,
                "question": "What are the limitations of this prototype?",
                "short_answer": "Runs locally in simulated mode without physical cell tower RF radio channels or hardware signaling gateways.",
                "technical_answer": "In production, Kafka runs across multi-node clusters with ZooKeeper/KRaft, Spark runs on Kubernetes or YARN, and data volumes exceed 500,000 eps. Our prototype faithfully emulates all core algorithmic and architectural principles locally.",
                "current_run_example": "Local mode uses bounded in-memory deques and SQLite to run out of the box on Windows without requiring multi-gigabyte container clusters."
            },
            {
                "id": 16,
                "question": "How do we evaluate whether a response was successful?",
                "short_answer": "By comparing quantifiable before-and-after delta metrics: queue reduction, latency drop, and zone utilization recovery.",
                "technical_answer": "The system records a baseline snapshot before applying mitigation, waits for the stream engine to process events under the new parameters, takes an after snapshot, and computes the mathematical improvement percentage.",
                "current_run_example": "The Network Response page displays side-by-side Before/After tables and explicitly evaluates whether the intervention succeeded."
            }
        ]

    def walk_through_run(self) -> Dict[str, Any]:
        """
        Generates an ordered, concise narrative of the current run for a viva presentation.
        """
        m = stream_engine.compute_window_metrics(30)
        scenario = generator.active_scenario
        zones = congestion_engine.evaluate_zones(10)
        anomalies = anomaly_detector.get_recent_anomalies(3)
        history = stream_engine.time_series_history
        
        narrative_steps = [
            {
                "step": 1,
                "title": "Simulation & Ingestion State",
                "detail": f"The pipeline is currently executing the '{scenario}' scenario at an ingestion rate of {generator.rate_eps} events/sec. A total of {generator.total_generated} events have been generated into the streaming buffer."
            },
            {
                "step": 2,
                "title": "Stream Window Processing",
                "detail": f"The stream engine is aggregating events across sliding windows (10s, 30s, 60s, 300s). In the active 30s window, {m['total_events']} events were processed ({m['sms_count']} SMS, {m['voice_count']} Voice), yielding a throughput of {m['throughput_eps']} eps."
            },
            {
                "step": 3,
                "title": "Quality of Service & Latency",
                "detail": f"SMS Delivery Latency is averaging {m['avg_sms_latency_ms']} ms with a failure rate of {m['sms_failure_rate']}%. Voice call failure rate is {m['call_failure_rate']}% with {m['voice_dropped']} dropped calls. In-flight queue backlog is {m['queue_backlog']} events."
            },
            {
                "step": 4,
                "title": "Congestion & Anomaly Evaluation",
                "detail": f"The statistical and ML detectors evaluated {len(zones)} cell clusters. Anomaly count: {len(anomalies)} active alerts detected using Methods A through E. Status: {len([z for z in zones if z['status'] in ['CONGESTED', 'CRITICAL']])} zones require operational intervention."
            },
            {
                "step": 5,
                "title": "Recommended Operator Action",
                "detail": "Based on current network indicators, the system recommends applying 'Dynamic Load Rerouting' or 'Auto-Scale Processing Capacity' to restore healthy headroom."
            }
        ]
        
        return {
            "scenario": scenario,
            "generated_at": time.time(),
            "throughput_eps": m["throughput_eps"],
            "steps": narrative_steps
        }

learning_engine = LearningAndExplainabilityEngine()
