'use strict';


exports.Fisher = function Fisher(name, type, params, o) {
    this.name = name;
    this.type = type;
    this.params = params;
    this.ocean = o;
    this.ready = (this.type === 'bot');
    this.hasReturned = false;
    this.seasonData = [];

    this.startMoney = 0;
    this.money = 0;
    this.totalFishCaught = 0;
    this.status = 'At port';
    this.season = 0;

    this.isBot = function () {
        return (this.type === 'bot');
    };

    this.isErratic = function () {
        return (this.params.predictability === 'erratic');
    };

    this.getIntendedCasts = function () {
        return this.seasonData[this.season].intendedCasts;
    };

    this.getActualCasts = function () {
        return this.seasonData[this.season].actualCasts;
    };

    this.calculateSeasonGreed = function (season) {
        return 0.5; // TODO --- do this
    };

    this.calculateSeasonCasts = function (season) {
        return 10; // TODO --- do this
    };

    this.prepareFisherForSeason = function (season) {
        this.seasonData[season] = {
            actualCasts: 0,
            intendedCasts: this.isBot() ? this.calculateSeasonCasts(season) : undefined,
            fishCaught: 0,
            startMoney: 0,
            endMoney: 0,
            greed: this.isBot() ? this.calculateSeasonGreed(season) : undefined
        };
        this.hasReturned = false;
        this.season = season;
    };

    this.changeMoney = function (amount) {
        this.money += amount;
        this.seasonData[this.season].endMoney += amount;
    };

    this.incrementCast = function () {
        this.seasonData[this.season].actualCasts++;
    };

    this.incrementFishCaught = function () {
        this.totalFishCaught++;
        this.seasonData[this.season].fishCaught++;
    };

    this.goToPort = function() {
        if (this.status !== 'At port') {
            this.status = 'At port';
            this.hasReturned = true;
            this.ocean.log.info('Fisher ' + this.name + ' returned to port.');
        }
    };

    this.goToSea = function () {
        this.status = 'At sea';
        this.changeMoney(-this.ocean.microworld.costDeparture);
        this.ocean.log.info('Fisher ' + this.name + ' sailed to sea.');
    };

    this.tryToFish = function () {
        this.changeMoney(-this.ocean.microworld.costCast);
        this.incrementCast();
        if (this.ocean.isSuccessfulCastAttempt()) {
            this.changeMoney(this.ocean.microworld.fishValue);
            this.incrementFishCaught();
            this.ocean.takeOneFish();
            this.ocean.log.info('Fisher ' + this.name + ' caught one fish.');
        } else {
            this.ocean.log.info('Fisher ' + this.name + ' tried to catch ' +
                'a fish, and failed.');
        }
    };

    this.runBot = function () {
        if (!this.isBot()) return;

        // Don't do anything if I'm erratic and I don't feel like it
        if (this.isErratic() && Math.random() > this.params.probAction) return;

        // TODO - should it be a check against fishCaught or actualCasts?
        // Am I done and still at sea?
        if (this.getIntendedCasts() <= this.getActualCasts()) {
            this.goToPort();
        }

        // Do I have more fish to catch?
        if (this.getIntendedCasts() > this.getActualCasts()) {
            if (this.status === 'At port') {
                this.goToSea();
            } else if (this.status === 'At sea' && this.ocean.areThereFish()) {
                this.tryToFish();
            }
        }
    };
};
