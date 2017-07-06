var domain = 'http://example.com',
    users = [
        {
            login: 'login1',
            pass: 'pass1'
        },
        {
            login: 'login2',
            pass: 'pass2'
        },
    ],
    startTestDelay = 1000,  // Usually it's delay for login between users
    steps;

// change steps for your test
steps = [
    function (page, user) {
        //Load Login Page
        page.open(domain);
    },

    function (page, user) {
        //Login

        page.evaluate(function(login, pass) {
            console.log(login + ' login-page title: ', $('.login_user_name').text());

            $('[name="login"]')[0].value = login;
            $('[name="password"]')[0].value = pass;

            $('.login_submit_btn').trigger('click');
        }, user.login, user.pass);
    },

    function (page, user) {
        // Output content of page to stdout after form has been submitted
        page.evaluate(function() {
            console.log('loaded-page title: ', $('.login_user_name').text());
        });

        // render image
        page.render(user.login + '.png');
    }
];

////////////////////////////////////////////////////
////////////    ----- START TESTING ----- ////////////

doTests (users, steps, startTestDelay);

////////////////////////////////////////////////////

function doTests (users, steps, delay) {
    var userCount = users.length,
        callback;

    callback = function () {
        (!(--userCount)) ? phantom.exit() : false;
    }

    users.forEach(function(user, index) {
        setTimeout(function () {
            console.log('start test #' + index);
            new Test(user, steps, callback);
        }, index * delay);
    });
}

function Test (user, steps, finishCallback) {
    var self = this;

    this.user = user;
    this.steps = steps;
    this.finishCallback = finishCallback || phantom.exit;
    this.page = new WebPage();
    this.testIndex = 0;
    this.loadInProgress = false;
    this.delay = 5000;
    this.interval;

    // add events
    this.page.onConsoleMessage = function (msg) {
        console.log(self.user.login + ' console message: ' + msg);
    };

    this.page.onLoadStarted = function () {
        self.loadInProgress = true;
        console.log('load ' + self.user.login + ' started');
    };

    this.page.onLoadFinished = function () {
        self.loadInProgress = false;
        console.log('load ' + self.user.login + ' finished');
    };

    this.interval = setInterval(function () {
        if (
            !self.loadInProgress 
            && typeof(self.steps[self.testIndex]) == 'function'
        ) {
            console.log('step ' + self.testIndex + ' for user: ' + self.user.login);

            self.steps[self.testIndex](self.page, self.user);
            ++self.testIndex;
        }

        if (
            !self.loadInProgress
            && typeof(self.steps[self.testIndex]) != 'function'
        ) {
            console.log('TEST COMPLETE! for user: ' + self.user.login);

            self.finishCallback();
            clearInterval(self.interval);
        }
    }, this.delay);
}
