function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

const _createAndSetUpNewOrderModel = (_deliveryDate, _deliverySlot, _deliveryType, _shippingDate) => {
   // Set up new order
      let d = new Date();
      let title = 'Your order from ' + d.toDateString().substring(4,7) + ' ' + d.getDay();
      //d.toDateString().substring(4,10) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' order';
      let newOrder = Noodl.Model.create();
      newOrder.set('title', title);
      newOrder.set('date', d);
      
      let twoDaysFromToday = new Date();
      twoDaysFromToday.setDate(twoDaysFromToday.getDate() + 2);

      let deliveryDate = _deliveryDate ? _deliveryDate : new Date();
      let deliverySlot = _deliverySlot === undefined ? 0 : _deliverySlot;
      let deliveryType = _deliveryType === undefined ? "delivery" : _deliveryType;
      let shippingDate = _shippingDate === undefined ? twoDaysFromToday : _shippingDate;
      
      let orderState = 'placed';

      // Set up collections
      let deliveryCollectionId = 'd' + Date.now();
      let shippingCollectionId = 's' + Date.now();
      let delivery = Noodl.Collection.get(deliveryCollectionId);
      let shipping = Noodl.Collection.get(shippingCollectionId);
      newOrder.set('deliveryCollectionId', deliveryCollectionId);
      newOrder.set('shippingCollectionId', shippingCollectionId);
      
      newOrder.set('deliveryDate', deliveryDate);
      newOrder.set('deliverySlot', deliverySlot);
      newOrder.set('deliveryType', deliveryType);
      newOrder.set('shippingDate', shippingDate);
      
      newOrder.set('orderState', orderState)

      return newOrder;
};

const _findEntryByItemId = (collection, itemId) => {
    for (let i=0; i < collection.size(); ++i){
        const itemModel = collection.get(i);
        if(itemModel.get("itemId") === itemId){
            return itemModel;
        }
    }        
    
    return null;
};


Noodl.defineModule({
    setup() {
        window.Ferrell = {};
        window.Ferrell.findEntryByItemId = _findEntryByItemId;
        window.Ferrell.createAndSetUpNewOrderModel = _createAndSetUpNewOrderModel;
    }
});