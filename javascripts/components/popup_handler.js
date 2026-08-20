/***
 * Popup Trigger  
 * @param url
 */
function popup_trigger_new_page(url) {
  console.log('triggering new popup function ')
  $.facebox({ ajax: url })
  return false
}
