import { describe, expect, it } from "vitest";
import { parseTradeCsv } from "./tradeCsv";

describe("parseTradeCsv mirae", () => {
  it("parses mirae execution rows", () => {
    const csv = `체결일자,체결시간,종목명,매매구분,체결수량,체결단가,수수료,제세금
2026-06-01,09:05,SK하이닉스,매수,10,250000,340,0
2026-06-02,14:20,SK하이닉스,매도,5,260000,180,1300`;

    const result = parseTradeCsv(csv, "mirae");
    expect(result.format).toBe("mirae");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].type).toBe("buy");
    expect(result.rows[1].tax).toBe(1300);
  });

  it("parses mirae journal (buy/sell columns)", () => {
    const csv = `일자,종목명,매수수량,매수평균단가,매수금액,매도수량,매도평균단가,매도금액,매매비용,손익
2026-06-01,삼성전자,5,70000,350000,0,0,0,500,0
2026-06-10,삼성전자,0,0,0,5,72000,360000,800,8500`;

    const result = parseTradeCsv(csv, "mirae");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ type: "buy", quantity: 5, price: 70000 });
    expect(result.rows[1]).toMatchObject({ type: "sell", quantity: 5, price: 72000 });
  });
});
