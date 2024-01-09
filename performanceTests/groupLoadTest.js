import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Trend, Counter } from 'k6/metrics';

export const TrendRTT = new Trend('RTT');
export const CounterErrors = new Counter('Errors');

const username = 'gaurav';
const password = 'password';

export let options = {
    vus: 100,
    stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 }
    ],
    thresholds: {
        RTT: ['avg<500'],
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<500'], // 95 percent of response times must be below 500ms
        Errors: ['count<100']
    }
}

export default function() {
    group('v1 API testing', function() {
        group('heart-beat', function() {
            let res = http.get("https://httpbin.org/get");
            check(res, { "status is 200": (r) => r.status === 200 });
            TrendRTT.add(res.timings.duration);
            const contentOK = res.status === 200
            CounterErrors.add(!contentOK);
        });

        group('login', function() {
            const requestBody = {
                user: username,
                password: password,
            };
            let res = http.post("https://load-testing-app-a17652b9ed75.herokuapp.com/login", JSON.stringify(requestBody), {
                headers: { 'Content-Type': 'application/json' },
            });
            const contentOK = res.status === 200
            CounterErrors.add(!contentOK);
        });
    });
}
