var cnfg = require('./../lib/facebook/config');

var facebookPaymentProcessAction = function(req, res) {
  var step = req.query.method;

  var isGettingItems = step === "payments_get_items";
  var isUpdatingStatus = step === "payments_status_update";

  if (isGettingItems) {
    var orderId = req.query.order_id;
    var orderInfo = req.query.order_info;
  } else if (isUpdatingStatus) {
    var orderId = req.query.order_id;
    var orderInfo = req.query.order_info;
    var orderStatus = req.query.status;
  }
}

module.exports = {
  get_process: facebookPaymentProcessAction,
  post_process: facebookPaymentProcessAction
};