var translations = {
  ru: {
    h: 'Спасибо, что заглянули!',
    sub: 'Выберите удобный способ связи',
    site_label: 'Сайт',
    email_label: 'Email',
    footer: 'Clean Cleanom · Клининг в Белграде'
  },
  sr: {
    h: 'Hvala što ste svratili!',
    sub: 'Izaberite pogodan način za kontakt',
    site_label: 'Sajt',
    email_label: 'Email',
    footer: 'Clean Cleanom · Čišćenje u Beogradu'
  },
  en: {
    h: 'Thanks for stopping by!',
    sub: 'Choose a way to reach us',
    site_label: 'Website',
    email_label: 'Email',
    footer: 'Clean Cleanom · Cleaning in Belgrade'
  }
};

function setLang(lang) {
  var dict = translations[lang] || translations.ru;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
  document.documentElement.lang = lang;
  localStorage.setItem('cc_lang', lang);
  var sel = document.getElementById('lang-select');
  if (sel) sel.value = lang;
}

document.getElementById('lang-select').addEventListener('change', function (e) {
  setLang(e.target.value);
});

setLang(localStorage.getItem('cc_lang') || 'ru');
