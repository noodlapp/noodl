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

/**
 * Log an error thrown by the JavaScript nodes.
 *
 * @param {any} error 
 */
function logJavaScriptNodeError(error) {
  if (typeof error === 'string') {
    console.log('Error in JS node run code.', error);
  } else {
    console.log(
      'Error in JS node run code.',
      Object.getPrototypeOf(error).constructor.name + ': ' + error.message,
      error.stack
    );
  }
}

module.exports = {
  getAbsoluteUrl,
  logJavaScriptNodeError
};
