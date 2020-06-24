import { Formula } from '../models/formula/formula';
import WebSocketClient from 'src/app/modules/core/services/websocket-client';

export class LazyModelFetcher {
    private ws: WebSocketClient;
    private readonly connected: Promise<void>;
    private locked: boolean;
    public is_finished: boolean;

    constructor(ws: WebSocketClient, connected: Promise<void>) {
        this.ws = ws;
        this.connected = connected;
        this.locked = false;
        this.is_finished = false;
    }

    async fetchModels(n: number): Promise<string[][]> {
        if (this.locked) {
            return [];
        }
        this.locked = true;
        await this.connected;

        this.is_finished = !this.ws.connected;

        for (let i = 0; i < n; i++) {
            try {
                this.ws.send('{"stdin":"\\n"}');
            } catch (e) {
                return [];
            }
        }

        let line = '';
        let true_props: string[] = undefined;
        let res: string[][] = [];

        while (true) {
            try {
                let v = await this.ws.receive();
                v = JSON.parse(v);
                if (v.type != 'stdout') {
                    console.log(v);
                    break;
                }
                line = v.msg;
            } catch (e) {
                break;
            }

            if (line.startsWith('unsat')) {
                break;
            }

            if (line.startsWith('==')) {
                if (true_props !== undefined) {
                    res.push(true_props);
                }
                true_props = undefined;
                if (res.length == n) {
                    break;
                }
                continue;
            }

            let s = line.split(' ');
            if (s.length != 2) {
                continue;
            }
            if (s[0] == '1') {
                if (true_props === undefined) {
                    true_props = [];
                }
                true_props.push(s[1]);
            }
        }
        if (true_props !== undefined) {
            res.push(true_props);
        }
        this.locked = false;
        return res;
    }
}

export class TouistService {
    static lazyModelFetcher(req: Formula): LazyModelFetcher {
        let ws = new WebSocketClient();
        let connected = ws.connect('ws://161.35.199.83:7015/touist_ws').then(() =>
            ws.send(
                JSON.stringify({
                    args: '--solve --interactive',
                    stdin: req.prettyPrint()
                })
            )
        );

        return new LazyModelFetcher(ws, connected);
    }

    static async fetchModel(req: Formula): Promise<string[]> {
        let data = new FormData();
        data.append('args', '--solve');
        data.append('stdin', req.prettyPrint());

        let methodInit = {
            method: 'POST',
            body: data
        };

        let response = await fetch('http://161.35.199.83:7015/touist_cmd', methodInit);
        let text = await response.text();
        if (text.startsWith('unsat')) {
            return [];
        }
        let true_props = [];
        for (let line of text.split('\n')) {
            let s = line.split(' ');
            if (s[0] == '1') {
                true_props.push(s[1]);
            }
        }
        return true_props;
    }

    static async fetchModels(req: Formula, limit: number): Promise<string[][]> {
        let data = new FormData();
        data.append('args', '--solve --limit ' + limit);
        data.append('stdin', req.prettyPrint());

        let methodInit = {
            method: 'POST',
            body: data
        };

        let response = await fetch('http://161.35.199.83:7015/touist_cmd', methodInit);
        let text = await response.text();
        if (text.startsWith('unsat')) {
            return [];
        }

        let res = [];
        let true_props = undefined;
        for (let line of text.split('\n')) {
            if (line.startsWith('unsat')) {
                break;
            }
            if (line.startsWith('==== model')) {
                if (true_props !== undefined) {
                    res.push(true_props);
                }
                true_props = [];
                continue;
            }
            let s = line.split(' ');
            if (s.length != 2) {
                continue;
            }
            if (s[0] == '1') {
                true_props.push(s[1]);
            }
        }
        if (true_props !== undefined) {
            res.push(true_props);
        }
        return res;
    }
}
