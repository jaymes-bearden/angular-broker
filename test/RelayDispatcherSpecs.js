describe('Relay Dispatcher', function () {

    beforeEach(function () {
        module("angular-broker");
    });

    beforeEach(inject(function (_RelayDispatcher_) {
        this.RelayDispatcher = _RelayDispatcher_;
    }));

    it('should return a dispatch object with subscribe, unsubscribe and dispatch', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();

        expect(dispatcher).toBeDefined();
        expect(angular.isFunction(dispatcher.subscribe)).toBeTruthy();
        expect(angular.isFunction(dispatcher.unsubscribe)).toBeTruthy();
        expect(angular.isFunction(dispatcher.dispatch)).toBeTruthy();
    });

    it('should not allow subscriptions without a handler function', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();

        expect(dispatcher.subscribe).toThrow();
    });

    it('should return a subscription object after subscribing a handler function', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var subscription = dispatcher.subscribe(function () {
        });

        expect(subscription).toBeDefined();
        expect(subscription).toEqual(jasmine.any(Object));
    });

    it('should return a subscription object containing an id, handler function and unsubscribe function', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = function () {
        };
        var subscription = dispatcher.subscribe(handler);

        expect(subscription).toBeDefined();
        expect(subscription.id).toBeDefined();
        expect(subscription.handler).toBe(handler);
        expect(subscription.unsubscribe).toEqual(jasmine.any(Function))
    });

    it('should have unique ids for each subscription', function () {
        var dispatcher1 = this.RelayDispatcher.getDispatcher();
        var dispatcher2 = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            },
            handler3: function () {
            }
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");
        spyOn(handler, "handler3");

        var subscription1 = dispatcher1.subscribe(handler.handler1);
        var subscription2 = dispatcher1.subscribe(handler.handler2);
        var subscription3 = dispatcher2.subscribe(handler.handler3);

        expect(subscription1.id).not.toBe(subscription2.id);
        expect(subscription2.id).not.toBe(subscription3.id);
    });

    it('should ignore attempts to unsubscribe with null or invalid objects', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler: function () {
            }
        };
        spyOn(handler, "handler");
        var subscription = dispatcher.subscribe(handler.handler);

        dispatcher.unsubscribe();
        dispatcher.unsubscribe({});
        dispatcher.unsubscribe({test: 1});

        dispatcher.dispatch({});

        expect(handler.handler).toHaveBeenCalled();
    });

    it('should not dispatch falsey message to handlers', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription = dispatcher.subscribe(handler.handler1);
        var subscription2 = dispatcher.subscribe(handler.handler2);

        dispatcher.dispatch();
        expect(handler.handler1).not.toHaveBeenCalled();
        expect(handler.handler2).not.toHaveBeenCalled();
    });

    it('should dispatch a message to all subscribed handlers', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription = dispatcher.subscribe(handler.handler1);
        var subscription2 = dispatcher.subscribe(handler.handler2);

        dispatcher.dispatch(msg);
        expect(handler.handler1).toHaveBeenCalledWith(msg);
        expect(handler.handler2).toHaveBeenCalledWith(msg);
    });

    it('should not change the message between message handler dispatches', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function (m) {
                m.test = 1;
            },
            handler2: function (m) {
                msg2 = m;
            }
        };
        var msg = {
            test: 0
        };
        var msg2;
        spyOn(handler, "handler1").andCallThrough();
        spyOn(handler, "handler2").andCallThrough();

        var subscription = dispatcher.subscribe(handler.handler1);
        var subscription2 = dispatcher.subscribe(handler.handler2);

        dispatcher.dispatch(msg);
        expect(handler.handler1).toHaveBeenCalled();
        expect(handler.handler2).toHaveBeenCalled();

        expect(msg.test).toBe(0);
        expect(msg2.test).toBe(0);
    });

    it('should remove the subscription after calling unsubscribe on the subscription object', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe(handler.handler1);
        var subscription2 = dispatcher.subscribe(handler.handler2);

        dispatcher.dispatch(msg);
        subscription1.unsubscribe();

        dispatcher.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1); // Only one since the subscription was removed
        expect(handler.handler2.calls.length).toBe(2);
    });

    it('should remove the subscription when sending the subscription object to the dispatcher directly', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe(handler.handler1);
        var subscription2 = dispatcher.subscribe(handler.handler2);

        dispatcher.dispatch(msg);
        dispatcher.unsubscribe(subscription1);

        dispatcher.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(2);
    });

    it('should change the subscription id after unsubscription', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        spyOn(dispatcher, "unsubscribe").andCallThrough();

        var subscription = dispatcher.subscribe(angular.noop);
        var subId = subscription.id;
        subscription.unsubscribe();

        expect(subId).not.toBe(subscription.id);
    });

    it('should change the subscription unsubscribe function to noop after unsubscription', function () {
        var dispatcher = this.RelayDispatcher.getDispatcher();
        spyOn(dispatcher, "unsubscribe").andCallThrough();

        var subscription = dispatcher.subscribe(angular.noop);
        subscription.unsubscribe();
        subscription.unsubscribe();

        expect(dispatcher.unsubscribe.calls.length).toBe(1);
    });

    it('should dispatch message only to handlers registered to that dispatcher', function () {
        var dispatcher1 = this.RelayDispatcher.getDispatcher();
        var dispatcher2 = this.RelayDispatcher.getDispatcher();
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            },
            handler3: function () {
            }
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");
        spyOn(handler, "handler3");

        var subscription1 = dispatcher1.subscribe(handler.handler1);
        var subscription2 = dispatcher1.subscribe(handler.handler2);
        var subscription3 = dispatcher2.subscribe(handler.handler3);

        dispatcher1.dispatch({});
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(1);
        expect(handler.handler3.calls.length).toBe(0);

        dispatcher2.dispatch({});
        dispatcher2.dispatch({});
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(1);
        expect(handler.handler3.calls.length).toBe(2);
    });
});