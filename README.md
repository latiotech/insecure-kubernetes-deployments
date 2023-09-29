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
