import { Formula } from '../models/formula/formula';

export class TouistService {
    static async fetchModel(req: Formula): Promise<string[]> {
        let data = new FormData();
        data.append("args", "--solve --limit 1");
        data.append("stdin", req.prettyPrint());

        let methodInit = {
            method: "POST",
            body: data,
        };

        let response = await fetch("http://collagol.douady.paris:7015/touist_cmd", methodInit);
        let text = await response.text();
        if (text.startsWith("unsat")) {
            return []
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
        data.append("args", "--solve --limit " + limit);
        data.append("stdin", req.prettyPrint());

        let methodInit = {
            method: "POST",
            body: data,
        };

        let response = await fetch("http://collagol.douady.paris:7015/touist_cmd", methodInit);
        let text = await response.text();
        if (text.startsWith("unsat")) {
            return []
        }

        let res = [];
        let true_props = undefined;
        for (let line of text.split('\n')) {
            if (line.startsWith("unsat")) {
                break;
            }
            if (line.startsWith("==== model")) {
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
