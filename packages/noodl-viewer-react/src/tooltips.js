export function createTooltip({ title, body, images }) {
  let html = `<h3>${title}</h3>`;
  if (body) {
    body = Array.isArray(body) ? body : [body];

    html += body.map((text) => `<p>${text}</p>`).join('');
  }

  if (images) {
    let imgHtml = '';

    images.forEach((e) => {
      imgHtml += `<div class="popup-layer-image-item">`;
      imgHtml += `<img src="../assets/images/tooltips/${e.src}">`;
      if (e.label) {
        imgHtml += `<h3>${e.label}</h3>`;
      }
      if (e.body) {
        imgHtml += `<p>${e.body}</p>`;
      }
      imgHtml += `</div>`;
    });

    html += `<div class="popup-layer-image-row">${imgHtml}</div>`;
  }

  return html;
}
