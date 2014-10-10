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

    this.getFishCaught = function () {
        return this.seasonData[this.season].fishCaught;
    };

    this.getIntendedCasts = function () {
        return this.seasonData[this.season].intendedCasts;
    };

    this.getActualCasts = function () {
        return this.seasonData[this.season].actualCasts;
    };

    this.calculateSeasonGreed = function () {
        return 0.5; // TODO --- do this
    };

    this.calculateSeasonCasts = function () {
        var totalFish = this.ocean.certainFish + this.ocean.mysteryFish;
        var spawn = this.ocean.microworld.params.spawnFactor;
        var numFishers = this.ocean.fishers.length;
        var greed = this.calculateSeasonGreed();
        var chanceCatch = this.ocean.microworld.params.chanceCatch;
        return Math.round(((totalFish - (totalFish / spawn)) / numFishers) 
            * 2 * greed / chanceCatch);
    };

    this.prepareFisherForSeason = function (season) {
        this.season = season;
        this.seasonData[season] = {
            actualCasts: 0,
            greed: this.isBot() ? this.calculateSeasonGreed() : undefined,
            intendedCasts: this.isBot() ? this.calculateSeasonCasts() : undefined,
            fishCaught: 0,
            startMoney: 0,
            endMoney: 0
        };
        this.hasReturned = false;
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

        // Am I done?
        if (this.getIntendedCasts() <= this.getActualCasts()) {
            this.goToPort();
        } else {
            // Should I go out or try to fish?
            if (this.status === 'At port') {
                this.goToSea();
            } else if (this.status === 'At sea' && this.ocean.areThereFish()) {
                this.tryToFish();
            }
        }
    };
};
