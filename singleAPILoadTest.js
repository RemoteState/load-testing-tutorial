import { check, group, sleep } from 'k6';
import http from 'k6/http';

export const TrendRTT = new Trend('RTT');
export const RateContentOK = new Rate('Content OK');
export const GaugeContentSize = new Gauge('ContentSize');
export const CounterErrors = new Counter('Errors');

export let options = {
    max_vus: 100,
    vus: 100,
    stages: [
        { duration: "30s", target: 10 },
        { duration: "4m", target: 100 },
        { duration: "30s", target: 0 }
    ],
    thresholds: {
        "RTT": ["avg<500"],
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<500'], // 95 percent of response times must be below 500ms

    }
}

export default function() {
    group('v1 API testing', function() {
        group('heart-beat', function() {
            let res = http.get("https://httpbin.org/get");
            check(res, { "status is 200": (r) => r.status === 200 });
            TrendRTT.add(res.timings.duration);
            RateContentOK.add(contentOK);
            GaugeContentSize.add(res.body.length);
            CounterErrors.add(!contentOK);
        });

        group('login', function() {
            let res = http.get("https://httpbin.org/bearer", {
                headers: { "Authorization": "Bearer da39a3ee5e6b4b0d3255bfef95601890afd80709" }
            });
            check(res, {
                "status is 200": (r) => r.status === 200,
                "is authenticated": (r) => r.json()["authenticated"] === true
            });
        });

        group('access an endpoint', function() {
            let res = http.get("https://httpbin.org/base64/azYgaXMgYXdlc29tZSE=");
            check(res, {
                "status is 200": (r) => r.status === 200,
                "k6 is awesome!": (r) => r.body === "k6 is awesome!"
            });
        });
    });
    sleep(1);
}
