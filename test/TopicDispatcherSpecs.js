describe('Topic Dispatcher', function () {

    beforeEach(function () {
        module("angular-broker");
    });

    beforeEach(inject(function (_TopicDispatcher_) {
        this.TopicDispatcher = _TopicDispatcher_;
    }));

    var messageTypeExtractor = function (msg) {
        return msg.type;
    };

    it('should require a defined topic extractor to acquire a dispatcher', function () {
        var topicDispatcher = this.TopicDispatcher;
        expect(topicDispatcher.getDispatcher).toThrow();
        expect(function () {
            topicDispatcher.getDispatcher()
        }).toThrow();
        expect(function () {
            topicDispatcher.getDispatcher(null)
        }).toThrow();
    });

    it('should return a dispatch object with subscribe, unsubscribe and dispatch', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);

        expect(dispatcher).toBeDefined();
        expect(angular.isFunction(dispatcher.subscribe)).toBeTruthy();
        expect(angular.isFunction(dispatcher.unsubscribe)).toBeTruthy();
        expect(angular.isFunction(dispatcher.dispatch)).toBeTruthy();
    });

    it('should not allow subscriptions with null or empty topic strings', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);

        expect(function () {
            dispatcher.subscribe()
        }).toThrow("Supplied topic must be a non-empty string");
        expect(function () {
            dispatcher.subscribe(null)
        }).toThrow("Supplied topic must be a non-empty string");
        expect(function () {
            dispatcher.subscribe("")
        }).toThrow("Supplied topic must be a non-empty string");
    });

    it('should not allow subscriptions without a handler function', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);

        expect(function () {
            dispatcher.subscribe("topic")
        }).toThrow("Supplied handler must be a function");
        expect(function () {
            dispatcher.subscribe("topic", {})
        }).toThrow("Supplied handler must be a function");
        expect(function () {
            dispatcher.subscribe("topic", null)
        }).toThrow("Supplied handler must be a function");
    });

    it('should return a subscription object after subscribing a handler function', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);
        var subscription = dispatcher.subscribe("topic", angular.noop);

        expect(subscription).toBeDefined();
        expect(subscription).toEqual(jasmine.any(Object));
    });

    it('should return a subscription object containing an id, handler function and unsubscribe function', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);
        var handler = function() {};
        var subscription = dispatcher.subscribe("topic", handler);

        expect(subscription).toBeDefined();
        expect(subscription.id).toBeDefined();
        expect(subscription.handler).toBe(handler);
        expect(subscription.unsubscribe).toEqual(jasmine.any(Function))
    });

    it('should return a subscription object with an id containing the topic', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);
        var topic = "topic";
        var subscription = dispatcher.subscribe(topic, angular.noop);

        expect(subscription).toBeDefined();
        expect(subscription.id).toContain(topic);
    });

    it('should return a subscription object containing the topic', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);
        var topic = "topic";
        var subscription = dispatcher.subscribe(topic, angular.noop);

        expect(subscription).toBeDefined();
        expect(subscription.topic).toEqual(topic);
    });

    it('should have unique ids for each subscription', function () {
        var dispatcher1 = this.TopicDispatcher.getDispatcher(angular.noop);
        var dispatcher2 = this.TopicDispatcher.getDispatcher(angular.noop);
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

        var subscription1 = dispatcher1.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher1.subscribe("topic", handler.handler2);
        var subscription3 = dispatcher2.subscribe("topic2", handler.handler3);

        expect(subscription1.id).not.toBe(subscription2.id);
        expect(subscription2.id).not.toBe(subscription3.id);
    });

    it('should ignore attempts to unsubscribe with null or invalid objects', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler: function () {
            }
        };
        spyOn(handler, "handler");
        var subscription = dispatcher.subscribe("topic", handler.handler);

        dispatcher.unsubscribe();
        dispatcher.unsubscribe({});
        dispatcher.unsubscribe({test: 1});

        dispatcher.dispatch({type: "topic"});

        expect(handler.handler).toHaveBeenCalled();
    });

    it('should not dispatch falsey message to handlers', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(angular.noop);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch();
        expect(handler.handler1).not.toHaveBeenCalled();
        expect(handler.handler2).not.toHaveBeenCalled();
    });

    it('should dispatch a message to all subscribed handlers for a given topic', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            },
            handler3: function() {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");
        spyOn(handler, "handler3");

        var subscription = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);
        var subscription3 = dispatcher.subscribe("topic2", handler.handler3);

        dispatcher.dispatch(msg);
        expect(handler.handler1).toHaveBeenCalledWith(msg);
        expect(handler.handler2).toHaveBeenCalledWith(msg);
        expect(handler.handler3).not.toHaveBeenCalled();
    });

    it('should not change the message between message handler dispatches for a given topic', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function (m) {
                m.test = 1;
            },
            handler2: function (m) {
                msg2 = m;
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        var msg2;
        spyOn(handler, "handler1").andCallThrough();
        spyOn(handler, "handler2").andCallThrough();

        var subscription = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch(msg);
        expect(handler.handler1).toHaveBeenCalled();
        expect(handler.handler2).toHaveBeenCalled();

        expect(msg.test).toBe(0);
        expect(msg2.test).toBe(0);
    });

    it('should remove the subscription after calling unsubscribe on the subscription object', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch(msg);
        subscription1.unsubscribe();

        dispatcher.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1); // Only one since the subscription was removed
        expect(handler.handler2.calls.length).toBe(2);
    });

    it('should clear the subscription object after calling unsubscribe on the subscription object with a bad topic', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch(msg);
        subscription1.topic = "blah";
        subscription1.unsubscribe();

        dispatcher.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(2);
        expect(handler.handler2.calls.length).toBe(2);
        expect(subscription1.id).toBe("");
        expect(subscription1.topic).toBe("");
        expect(subscription1.unsubscribe).toBe(angular.noop);
    });

    it('should remove the subscription when sending the subscription object to the dispatcher directly', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch(msg);
        dispatcher.unsubscribe(subscription1);

        dispatcher.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(2);
        expect(subscription1.id).toBe("");
        expect(subscription1.topic).toBe("");
        expect(subscription1.unsubscribe).toBe(angular.noop);
    });

    it('should change the subscription id after unsubscription', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        spyOn(dispatcher, "unsubscribe").andCallThrough();

        var subscription = dispatcher.subscribe("topic", angular.noop);
        var subId = subscription.id;
        subscription.unsubscribe();

        expect(subId).not.toBe(subscription.id);
        expect(subscription.id).toBe("");
    });

    it('should change the subscription unsubscribe function to noop after unsubscription', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        spyOn(dispatcher, "unsubscribe").andCallThrough();

        var subscription = dispatcher.subscribe("topic", angular.noop);
        subscription.unsubscribe();
        subscription.unsubscribe();

        expect(dispatcher.unsubscribe.calls.length).toBe(1);
    });

    it('should allowed for more subscriptions for a given topic after all of the topic\'s subscriptions have been removed', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");

        var subscription1 = dispatcher.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher.subscribe("topic", handler.handler2);

        dispatcher.dispatch(msg);
        subscription1.unsubscribe();
        subscription2.unsubscribe();

        subscription1 = dispatcher.subscribe("topic", handler.handler1);
        subscription2 = dispatcher.subscribe("topic", handler.handler2);
        dispatcher.dispatch(msg);

        subscription1.unsubscribe();
        dispatcher.dispatch(msg);

        expect(handler.handler1.calls.length).toBe(2);
        expect(handler.handler2.calls.length).toBe(3);
    });

    it('should dispatch message only to handlers registered to that dispatcher', function () {
        var dispatcher1 = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var dispatcher2 = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            },
            handler2: function () {
            },
            handler3: function () {
            }
        };
        var msg = {
            type: "topic",
            test: 0
        };
        spyOn(handler, "handler1");
        spyOn(handler, "handler2");
        spyOn(handler, "handler3");

        var subscription1 = dispatcher1.subscribe("topic", handler.handler1);
        var subscription2 = dispatcher1.subscribe("topic", handler.handler2);
        var subscription3 = dispatcher2.subscribe("topic", handler.handler3);

        dispatcher1.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(1);
        expect(handler.handler3.calls.length).toBe(0);

        dispatcher2.dispatch(msg);
        dispatcher2.dispatch(msg);
        expect(handler.handler1.calls.length).toBe(1);
        expect(handler.handler2.calls.length).toBe(1);
        expect(handler.handler3.calls.length).toBe(2);
    });

    it('should allow for subscriptions with topics containing spaces', function () {
        var dispatcher = this.TopicDispatcher.getDispatcher(messageTypeExtractor);
        var handler = {
            handler1: function () {
            }
        };
        var msg = {
            type: "topic 1",
            test: 0
        };
        spyOn(handler, "handler1");

        var subscription1 = dispatcher.subscribe("topic 1", handler.handler1);
        dispatcher.dispatch(msg);

        expect(handler.handler1.calls.length).toBe(1);
        expect(subscription1.topic).toBe("topic 1");
    });
});