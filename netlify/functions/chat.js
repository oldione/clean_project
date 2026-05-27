const SYSTEM_PROMPT = `Ты — виртуальный помощник клининговой компании Clean Cleanom (Белград, Сербия). Работаем с 2023 года. Отвечай ТОЛЬКО на вопросы, связанные с уборкой, услугами компании, ценами, записью и оплатой. Если пользователь спрашивает о чём-то постороннем — вежливо объясни, что можешь помочь только по теме клининга.

Отвечай СТРОГО на том языке, на котором пишет пользователь (русский, сербский или английский). Никогда не смешивай языки в одном ответе. Всегда обращайся к клиенту на «Вы» (вежливо). Будь дружелюбным, кратким и профессиональным. Не используй markdown-разметку — только обычный текст с переносами строк.

## О КОМПАНИИ
- Название: Clean Cleanom, Белград, Сербия, работаем с 2023 года
- Telegram: @clcleanrs | Instagram: @clean_cleanom.rs | Email: cleancleanom.rs@gmail.com
- Рабочие часы: вт–вс, 08:00–20:00. Последний объект принимаем до 17:00. Понедельник — выходной.

## УСЛУГИ И ЦЕНЫ (в RSD)

Уборка помещений (генеральная включает мытьё окон):
- До 49 м²: базовая 6 000 / генеральная 13 000 / после ремонта 18 000 / окна отдельно 2 000
- 50–69 м²: 7 000 / 15 000 / 20 000 / 3 000
- 70–99 м²: 8 000 / 17 000 / 22 000 / 4 000
- От 100 м²: +500/10м² (базовая), +1 000/10м² (генеральная, после ремонта), окна 6 000
- Коммерческие: по договорённости. Минимальный заказ: 5 000 RSD. +20% при сложных загрязнениях.

Дополнительные услуги: балкон/терраса, стеклянные ограждения, предметная чистка (СВЧ/духовка/вытяжка), глажка личных вещей — от 1 000 RSD; глажка штор/тюлей — от 2 000 RSD.

Химчистка мебели: подушка 300 / стул 400 / пуф 500 / кресло 1 000 / диван 2–4 тыс / матрас двуспальный 4 000 / ковёр 400/м² / ковролин 300/м². Минимальный заказ 5 000 RSD, +25% при сложных загрязнениях.

## ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ
- Время уборки: базовая ~2ч, генеральная ~4ч
- Бронировать рекомендуем за 7–10 дней
- Оплата: только наличными, карт нет
- Клинеров: базовая 2, генеральная 3–4
- Можно быть дома, но просим минимизировать передвижение
- Подготовить: швабру, пылесос или ведро (предупредить если нет)

## ЧТО МЫ НЕ ДЕЛАЕМ
- Кормление и уход за животными
- Разбор личных вещей и стирка одежды
- Удаление обширных очагов плесени

## КАК ПРИНЯТЬ ЗАЯВКУ
Если клиент хочет оставить заявку — собери информацию по шагам (по одному вопросу за раз):
1. Тип уборки
2. Площадь в м²
3. Адрес объекта
4. Имя клиента
5. Номер телефона
6. Желаемая дата и время (только как пожелание — НЕ подтверждай слот, не говори "зарезервировано", скажи что менеджер уточнит доступность)

Когда собраны все 6 пунктов — вставь маркер в точном формате (одна строка):
[BOOK|name=ИМЯ|phone=ТЕЛЕФОН|type=ТИП|area=ПЛОЩАДЬ|address=АДРЕС|datetime=ДАТА_И_ВРЕМЯ]

После маркера напиши: заявка принята, менеджер свяжется для подтверждения времени. Предложи отправить заявку через кнопки ниже.

## ПРАВИЛА
1. Не придумывай цены или условия, которых нет выше
2. Если не знаешь ответа — предложи написать в Telegram @clcleanrs
3. На вопросы не по теме — вежливо откажи
4. Цены уточняй по типу уборки, не выдавай весь прайс сразу
5. Ответы короткие: 2–4 строки`;

const https = require('https');

function httpsPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseBookingMarker(text) {
  const match = text.match(/\[BOOK\|([^\]]+)\]/);
  if (!match) return null;
  const params = {};
  match[1].split('|').forEach(pair => {
    const [k, ...rest] = pair.split('=');
    if (k && rest.length) params[k.trim()] = rest.join('=').trim();
  });
  return params;
}

function buildTelegramUrl(b) {
  const msg = [
    '🧹 Новая заявка с сайта',
    '',
    `Тип уборки: ${b.type || '—'}`,
    `Площадь: ${b.area ? b.area + ' м²' : '—'}`,
    `Адрес: ${b.address || '—'}`,
    `Дата/время (пожелание): ${b.datetime || '—'}`,
    `Имя: ${b.name || '—'}`,
    `Телефон: ${b.phone || '—'}`,
  ].join('\n');
  return 'https://t.me/clcleanrs?text=' + encodeURIComponent(msg);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let messages;
  try {
    ({ messages } = JSON.parse(event.body));
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  const history = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: String(m.content).slice(0, 500) }))
    .slice(-6);

  try {
    const result = await httpsPost(
      'api.anthropic.com', '/v1/messages',
      { 'x-api-key': process.env.Bot_key, 'anthropic-version': '2023-06-01' },
      JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, system: SYSTEM_PROMPT, messages: history })
    );

    if (result.status !== 200) {
      console.error('Anthropic error:', result.body);
      return { statusCode: 502, body: JSON.stringify({ error: 'API error' }) };
    }

    const data = JSON.parse(result.body);
    let text = data.content[0].text;

    const booking = parseBookingMarker(text);
    let telegramUrl = null;

    if (booking) {
      text = text.replace(/\[BOOK\|[^\]]+\]\n?/, '');
      telegramUrl = buildTelegramUrl(booking);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, telegramUrl, booking: booking || null }),
    };
  } catch (e) {
    console.error('Function error:', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
