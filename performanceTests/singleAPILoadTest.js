import { check, sleep } from 'k6';
import http from 'k6/http';


const username = 'gaurav';
const password = 'password';


export let options = {
    vus: 100,
    stages: [
        { duration: "10s", target: 10 },
        { duration: "10s", target: 100 },
        { duration: "10s", target: 0 }
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<500'], // 95 percent of response times must be below 500ms
    }
}

export default function() {
    const requestBody = {
        username: username,
        password: password,
    };
    let res = http.post("https://load-testing-app-a17652b9ed75.herokuapp.com/login", JSON.stringify(requestBody), {
        headers: { 'Content-Type': 'application/json' },
    });
    check(res, {
        "status is 200": (r) => r.status === 200,
    });
}
