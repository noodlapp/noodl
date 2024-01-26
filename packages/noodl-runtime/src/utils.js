//this just assumes the base url is '/' always
function getAbsoluteUrl(_url) {

  //convert to string in case the _url is a Cloud File (which is an object with a custom toString())
  const url = String(_url);

  //only add a the base url if this is a local URL (e.g. not a https url or  base64 string)
  if (!url || url[0] === "/" || url.includes("://") || url.startsWith('data:')) {
    return url;
  }

  return (Noodl.baseUrl || '/') + url;
}

module.exports = {
  getAbsoluteUrl
};
