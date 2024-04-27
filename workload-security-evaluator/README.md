Workload Security Evaluator provides tooling to simulate runtime attacks and test default runtime detections from Datadog Cloud Security Management. Tests are completed using [Atomic Red Team](https://atomicredteam.io/).

Read the [corresponding blog post](https://datadoghq.com/blog/workload-security-evaluator) for more details.

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Atomic test organization](#atomic-test-organization)
- [Test against real-world threats](#test-against-real-world-threats)
- [Techniques not relevant to production workloads](#techniques-not-relevant-to-production-workloads)

## Requirements

Workload Security Evaluator runs on Docker. For the most accurate results, Datadog recommends launching a compute instance in your preferred cloud provider. Alternatively, use a virtual machine or Docker Desktop. Apple silicon is not supported.

## Getting started

1. Build and run the containers with the following commands.
```
export DD_API_KEY="<api-key>" # Found at https://app.datadoghq.com/organization-settings/api-keys
docker compose build
docker compose up -d
```
2. Enter the evaluator container and run atomics.
```
docker exec -it atomicredteam /usr/bin/pwsh
Invoke-AtomicTest T1105-27 -ShowDetails
Invoke-AtomicTest T1105-27 -GetPrereqs # Download packages or payloads
Invoke-AtomicTest T1105-27
```
3. Check for a signal in the Datadog [Signals Explorer](https://app.datadoghq.com/security?query=env%3Aemulation) page. Signals from Workload Security Evaluator are tagged with `env:emulation` to differentiate them from real security threats.
4. Revert the changes made by the atomic.
```
Invoke-AtomicTest T1053.003-2 -Cleanup
```
5. Repeat with a different atomic.
6. Shutdown the containers.
```
docker compose down
```

## Atomic test organization

[Atomic Red Team](https://atomicredteam.io/) often contains multiple tests for the same ATT&CK technique. For example, the test identifier T1136.001-1 refers to the first test for MITRE ATT&CK technique T1136.001 (Create Account: Local Account). This test creates an account on a Linux system. The second test, T1136.001-2, creates an account on a MacOS system.

## Test against real-world threats

The following atomics are recommended as a starting point. They emulate techniques that were observed in real attacks targeting cloud workloads.

| Atomic ID | Atomic Name | Datadog Rule |Source|
|-----------|-------------|--------------|------|
|T1105-27|[Linux Download File and Run](https://atomicredteam.io/command-and-control/T1105/#atomic-test-27---linux-download-file-and-run)|[Executable bit added to new file](https://docs.datadoghq.com/security/default_rules/executable_bit_added/)|[Source](https://blog.talosintelligence.com/teamtnt-targeting-aws-alibaba-2/)|
|T1046-2|[Port Scan Nmap](https://atomicredteam.io/discovery/T1046/#atomic-test-2---port-scan-nmap)|[Network scanning utility executed](https://docs.datadoghq.com/security/default_rules/common_net_intrusion_util/)|[Source](https://blog.talosintelligence.com/teamtnt-targeting-aws-alibaba-2/)|
|T1574.006-1|[Shared Library Injection via /etc/ld.so.preload](https://atomicredteam.io/defense-evasion/T1574.006/#atomic-test-1---shared-library-injection-via-etcldsopreload)|[Suspected dynamic linker hijacking attempt](https://docs.datadoghq.com/security/default_rules/suspected_dynamic_linker_hijacking/)|[Source](https://unit42.paloaltonetworks.com/hildegard-malware-teamtnt/)|
|T1053.003-2|[Cron - Add script to all cron subfolders](https://atomicredteam.io/privilege-escalation/T1053.003/#atomic-test-2---cron---add-script-to-all-cron-subfolders)|[Cron job modified](https://docs.datadoghq.com/security/default_rules/cron_at_job_injection/)|[Source](https://blog.talosintelligence.com/rocke-champion-of-monero-miners/)
|T1070.003-1|[Clear Bash history (rm)](https://atomicredteam.io/defense-evasion/T1070.003/#atomic-test-1---clear-bash-history-(rm))|[Shell command history modified](https://docs.datadoghq.com/security/default_rules/shell_history_tamper/)|[Source](https://unit42.paloaltonetworks.com/hildegard-malware-teamtnt/)|

For a full list of Datadog's runtime detections, visit the [Out-of-the-box (OOTB) rules](https://docs.datadoghq.com/security/default_rules/#cat-workload-security) page. MITRE ATT&CK tactic and technique information is provided for every rule.

## Techniques not relevant to production workloads

The MITRE ATT&CK [Linux Matrix](https://attack.mitre.org/matrices/enterprise/linux/) contains techniques for Linux hosts with a variety of purposes. Testing the techniques located in [notrelevant.md](notrelevant.md) is not recommended, because they are focused on Linux workstations or are unlikely to be detected using operating system events.

[Visualize with ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator//#layerURL=https%3A%2F%2Fraw%2Egithubusercontent%2Ecom%2FDataDog%2Fworkload-security-evaluator%2Fmain%2Fnotrelevant_layer%2Ejson).