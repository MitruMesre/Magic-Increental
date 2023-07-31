class Resource {
    constructor(name, amount, maximum, perSecond) {
        this.name = name;
        this.amount = amount;
        this.maximum = maximum;
        this.perSecond = perSecond;
    }

    addAmount(amount = this.perSecond) {
        this.amount += amount;
        if (this.amount > this.maximum) {
            this.amount = this.maximum;
        }
        if (this.amount < 0) {
            this.amount = 0;
        }
    }
}

class Building {
    constructor(name, cost, amount, costCreep) {
        this.name = name;
        this.cost = cost;
        this.costOriginal = { ...cost };
        this.amount = amount;
        this.costCreep = costCreep;
    }

    build(resources) {
        for (const [resourceName, cost] of Object.entries(this.cost)) {
            if (resources[resourceName].amount < cost) {
                return;
            }
        }

        for (const [resourceName, cost] of Object.entries(this.cost)) {
            resources[resourceName].addAmount(-cost);
        }

        this.effect(resources);

        this.amount += 1;

        for (const resourceName of Object.keys(this.cost)) {
            this.cost[resourceName] *= this.costCreep;
            this.cost[resourceName] = Math.ceil(this.cost[resourceName]);
        }


        updateUI();
    }

    recalculateCostCreep() {
        for (const [resourceName, cost] of Object.entries(this.cost)) {
            this.cost[resourceName] = this.costOriginal[resourceName];
            for (let i = 0; i < this.amount; i++) {
                this.cost[resourceName] = Math.ceil(this.cost[resourceName] * this.costCreep);
            }
        }
    }
}

class StorageBuilding extends Building {
    constructor(name, cost, amount, costCreep, storageEffect) {
        super(name, cost, amount, costCreep);
        this.storageEffect = storageEffect;
    }

    effect(resources) {
        for (const [resourceName, effect] of Object.entries(this.storageEffect)) {
            resources[resourceName].maximum += effect;
        }
    }
}

class ProductionBuilding extends Building {
    constructor(name, cost, amount, costCreep, productionEffect) {
        super(name, cost, amount, costCreep);
        this.productionEffect = productionEffect;
    }

    effect(resources) {
        for (const [resourceName, effect] of Object.entries(this.productionEffect)) {
            resources[resourceName].perSecond += effect;
        }
    }

    recalculateProductionEffect() {
        for (const [resourceName, effect] of Object.entries(this.productionEffect)) {

        }
    }
}

class Upgrade {
    constructor(name, cost, effect, purchased = false) {
        this.name = name;
        this.cost = cost;
        this.effect = effect;
        this.purchased = purchased;
    }

    purchase(resources) {
        if (this.purchased) {
            return;
        }

        for (const [resourceName, cost] of Object.entries(this.cost)) {
            if (resources[resourceName].amount < cost) {
                return;
            }
        }

        for (const [resourceName, cost] of Object.entries(this.cost)) {
            resources[resourceName].addAmount(-cost);
        }

        this.purchased = true;
        this.effect();
    }
}

let gameData = {
    resources: {
        mana: new Resource("Mana", 100, 100, 1),
        metal: new Resource("Metal", 0, 100, 0),
    },
    buildings: {
        metalCollector: new ProductionBuilding("MetalCollector", { mana: 10 }, 0, 1.5, { metal: 1 }),
        manaGenerator: new ProductionBuilding("ManaGenerator", { mana: 10, metal: 10 }, 0, 1.5, { mana: 1 }),
        superAccumulator: new ProductionBuilding("SuperAccumulator", { mana: 100, metal: 100 }, 0, 3, { mana: 25, metal: 25 }),
        manaStorage: new StorageBuilding("ManaStorage", { mana: 20, metal: 10 }, 0, 1.5, { mana: 100 }),
        metalStorage: new StorageBuilding("MetalStorage", { mana: 20, metal: 20 }, 0, 1.5, { metal: 100 }),
        superStorage: new StorageBuilding("SuperStorage", { mana: 100, metal: 100 }, 0, 1.5, { mana: 1000, metal: 1000 }),
    },
    upgrades: {
        cheaperProduction: new Upgrade("CheaperProduction", { mana: 100, metal: 100 }, function () {
            gameData.buildings.metalCollector.costCreep = Math.sqrt(gameData.buildings.metalCollector.costCreep);
            gameData.buildings.manaGenerator.costCreep = Math.sqrt(gameData.buildings.manaGenerator.costCreep);

            gameData.buildings.metalCollector.recalculateCostCreep();
            gameData.buildings.manaGenerator.recalculateCostCreep();
        }),
        morePowerfulMachines: new Upgrade("MorePowerfulMachines", { mana: 500, metal: 500 }, function () {
            // Multiply production effect by 2
            const { metalCollector, manaGenerator } = gameData.buildings;
            for (const resourceName of Object.keys(metalCollector.productionEffect)) {
                metalCollector.productionEffect[resourceName] *= 2;
            }
            for (const resourceName of Object.keys(manaGenerator.productionEffect)) {
                manaGenerator.productionEffect[resourceName] *= 2;
            }
            // Multiply already applied production effect by 2 (by readding the effect (which is just 1) * the # of machines built)
            gameData.resources.mana.perSecond += gameData.buildings.manaGenerator.amount;
            gameData.resources.metal.perSecond += gameData.buildings.metalCollector.amount;

            // For the future, I should probably swap the order of those, since the first half changes the value of the second half lol
        }),
        increasedStorage: new Upgrade("IncreasedStorage", { mana: 200, metal: 200 }, function () {
            // Multiply storage effect by 2
            const { manaStorage, metalStorage } = gameData.buildings;
            for (const resourceName of Object.keys(manaStorage.storageEffect)) {
                manaStorage.storageEffect[resourceName] *= 2;
            }
            for (const resourceName of Object.keys(metalStorage.storageEffect)) {
                metalStorage.storageEffect[resourceName] *= 2;
            }
            // Multiply already applied storage effect by 2 (by readding the effect * the # of machines built)
            gameData.resources.mana.maximum += gameData.buildings.manaStorage.amount * 100;
            gameData.resources.metal.maximum += gameData.buildings.metalStorage.amount * 100;

            // For the future, I should probably swap the order of those, since the first half changes the value of the second half lol
        })
    }
}

function updateResources() {
    for (let resource of Object.values(gameData.resources)) {
        resource.addAmount();
    }
}

function updateUI() {
    for (let resource of Object.values(gameData.resources)) {
        document.getElementById(resource.name + "Amount").innerHTML = resource.amount;
        document.getElementById(resource.name + "Maximum").innerHTML = resource.maximum;
        document.getElementById(resource.name + "PerSecond").innerHTML = resource.perSecond;
    };
    for (let building of Object.values(gameData.buildings)) {
        const cost = building.cost;
        let costString = "";
        for (const [resourceName, resourceAmount] of Object.entries(cost)) {
            const resourceNameCapitalized = resourceName[0].toUpperCase() + resourceName.slice(1);
            costString += resourceNameCapitalized + ": " + resourceAmount + " ";
        }

        const effect = building.productionEffect || building.storageEffect;
        let effectString = "";
        for (const [resourceName, resourceAmount] of Object.entries(effect)) {
            const resourceNameCapitalized = resourceName[0].toUpperCase() + resourceName.slice(1);
            effectString += resourceNameCapitalized + ": " + resourceAmount + " ";
        }

        document.getElementById(building.name + "Amount").innerHTML = building.amount;
        document.getElementById(building.name + "Cost").innerHTML = costString;
        document.getElementById(building.name + "Effect").innerHTML = effectString;
    };
    for (let upgrade of Object.values(gameData.upgrades)) {
        if (upgrade.purchased) {
            document.getElementById(upgrade.name + "PurchasedBool").innerHTML = "True";
        } else {
            document.getElementById(upgrade.name + "PurchasedBool").innerHTML = "False";
        }
    }
}

updateUI();
var mainGameLoop = window.setInterval(function () {
    updateResources();
    updateUI();
}, 1000);

