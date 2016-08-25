var Simple1DNoise = function() {
    var MAX_VERTICES = 256;
    var MAX_VERTICES_MASK = MAX_VERTICES - 1;
    var amplitude = 1;
    var scale = 1;

    var r = [];

    for (var i = 0; i < MAX_VERTICES; ++i) {
        r.push(Math.random());
    }

    var getVal = function(x) {
        var scaledX = x * scale;
        var xFloor = Math.floor(scaledX);
        var t = scaledX - xFloor;
        var tRemapSmoothstep = t * t * (3 - 2 * t);

        /// Modulo using &
        var xMin = xFloor & MAX_VERTICES_MASK;
        var xMax = (xMin + 1) & MAX_VERTICES_MASK;

        var y = lerp(r[xMin], r[xMax], tRemapSmoothstep);

        return y * amplitude;
    };

    /**
     * Linear interpolation function.
     * @param a The lower integer value
     * @param b The upper integer value
     * @param t The value between the two
     * @returns {number}
     */
    var lerp = function(a, b, t) {
        return a * (1 - t) + b * t;
    };

    // return the API
    return {
        getVal: getVal,
        setAmplitude: function(newAmplitude) {
            amplitude = newAmplitude;
        },
        setScale: function(newScale) {
            scale = newScale;
        }
    };
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function findLineFormula(pointA, pointB) {
    var slope = (pointB.y - pointA.y) / (pointB.x - pointA.x);

    var constant = (slope * (-pointA.x)) + pointA.y;

    return function(x) {
        return x * slope + constant;
    }
}

function findMinPoint(peaks) {
    return peaks.sort(function(a, b) {
        return a.y - b.y;
    })[0];
}

var mountains = {
    simplePeaksGenerator: function() {
        var peaks = [{
            x: 0,
            y: 0
        }];
        for (var i = 1; i < this.peaksAmount + this.peaksAmount + 1; i++) {
            var y,
                x;

            if (i % 2 !== 0) {
              if (peaks[i - 1].y === 0) {
                y = getRandomArbitrary(this.maxHeight * 0.2, this.maxHeight);

              }else{
                y = getRandomArbitrary(peaks[i - 1].y * 1.5, this.maxHeight);
              }
                //possible peaks
            } else {
                //possible valleys
                y = getRandomArbitrary(this.maxHeight * 0.1, peaks[i - 1].y * 0.4);
            }


            x = getRandomArbitrary(peaks[i - 1].x * 1.15, peaks[i - 1].x * 1.1 + this.maxWidth * 0.8)

            if (!peaks[i - 1].x) {
                x = getRandomArbitrary(this.maxWidth * 0.3, peaks[i - 1].x * 1.1 + this.maxWidth * 0.8)
            }

            if (i === this.peaksAmount * 2) {
                y = 0;
            }
            peaks.push({
                x: x,
                y: y
            })

            console.log(x, y);
        }

        this.lowResPath = peaks;
        return this;
    },
    generatePeak: function generatePeak() {
        var peak = [{
            x: 0,
            y: 0
        }];

        peak[2] = {
            x: getRandomArbitrary(50, 100),
            y: 0
        };

        peak[1] = {
            x: getRandomArbitrary(10, peak[2].x - 10),
            y: getRandomArbitrary(10, this.maxHeight)
        };

        return peak;
    },
    createPeaksPoints: function(amount) {
        var peaks = [];
        amount = amount || 2; //default to 2 peaks

        for (var i = 0; i < amount; i++) {
            peaks.push(generatePeak());
        }

        this.originalTriangles = peaks;
        return this;
    },
    separatePeaks: function() {

        peaks = this.originalTriangles.map(function(peak, index, originalPeaks) {
            //if first peak, we do nothing
            if (!index) {
                return peak;
            }

            var translateX = peaks[index - 1][2].x - (peaks[index - 1][2].x - peaks[index - 1][1].x);

            peak.forEach(function(vector) {
                vector.x = vector.x + translateX;
            });

            return peak;

        });

        this.peaksPoints = peaks;
        return this;
    },
    getSideIntercept: function(firstA, secondA, firstB, secondB) {
        //we intercept two lines to get valley points \./
        var pendienteA = -firstA.y / (secondA.x - firstA.x);
        var peakAConstant = -secondA.x * pendienteA;

        var pendienteB = secondB.y / (secondB.x - firstB.x);
        var peakBConstant = -firstB.x * pendienteB;

        var sameX = (peakAConstant - peakBConstant) / (pendienteB - pendienteA);
        var sameY = (sameX * pendienteA) + peakAConstant;

        return {
            x: sameX,
            y: sameY
        }
    },
    joinPeaks: function(peaks) {

        this.lowResPath = this.peaksPoints.reduce(function(newPeaks, peak, index, originalPeaks) {

            //first peak we pass along the left base and peak
            if (!index) {
                newPeaks.push(peak[0]);
                newPeaks.push(peak[1]);
                return newPeaks;
            }

            //we add the the intercept valley point
            newPeaks.push(getSideIntercept(originalPeaks[index - 1][1], originalPeaks[index - 1][2], peak[0], peak[1]));

            //we pass the peak point of the second mountain
            newPeaks.push(peak[1]);

            //if last peak, we add the rightmost base point
            if (index === originalPeaks.length - 1) {
                newPeaks.push(peak[2]);
            }

            return newPeaks;
        }, []);

        return this;

    },
    findLineFormula: function(pointA, pointB) {
        var slope = (pointB.y - pointA.y) / (pointB.x - pointA.x);

        var constant = (slope * (-pointA.x)) + pointA.y;

        return function(x) {
            return x * slope + constant;
        }
    },
    increaseResolution: function() {
        //we get how small the increment to create new points between bases, peaks and valleys
        //I think this is simillar to marching squares or sth
        var simpleUnit = this.lowResPath[this.lowResPath.length - 1].x / this.resolution;
        var unit = simpleUnit;
        this.HighResPath = this.lowResPath.reduce(function(HRPeaks, peak, index, originalPeaks) {
            // console.log('UNIT: ', unit);
            if (!index) {
                HRPeaks.push(peak);
                return HRPeaks;
            }

            var lowerLimit = originalPeaks[index - 1].x;
            var upperLimit = peak.x;

            var getY = findLineFormula(originalPeaks[index - 1], peak);

            while (unit > lowerLimit && unit <= upperLimit) {
                // console.log(constant);
                HRPeaks.push({
                    x: unit,
                    y: getY(unit)
                });
                unit += simpleUnit;
            }

            return HRPeaks;
        }, []);

        return this;
    },
    perlinPeaks: function(peaks) {
        var smallDetail = new Simple1DNoise();
        var mediumDetail = new Simple1DNoise();
        var bigDetail = new Simple1DNoise();
        smallDetail.setScale(0.5);
        mediumDetail.setScale(0.22);
        bigDetail.setScale(0.05);


        this.HighResPath = this.HighResPath.map(function(point, index, originalPeaks) {
            var perlin = (smallDetail.getVal(point.x) * 0.1 + mediumDetail.getVal(point.x) * 0.5 + bigDetail.getVal(point.x)) * 1 / 3;
            var y;
            if (!originalPeaks[index - 1] || originalPeaks[index - 1].y === 0) {
                y = point.y + perlin * 30;
            } else {
                y = point.y + perlin * 30 //originalPeaks[index-1].y
            }

            return {
                x: point.x,
                y: point.y + perlin * 30
            }
        });

        return this;
    },
    findMaxPoints: function() {
        var width = this.HighResPath.length; //peak width in units
        var margin = width * 0.01; //limit on each side to count as peak
        var _this = this;
        var maxims = [];
        this.HighResPath.forEach(function(peak, index) {
            if (!index) {
                return;
            }
            if (!_this.HighResPath[index + 1]) {
                return;
            }

            if (_this.HighResPath[index - 1].y < peak.y && _this.HighResPath[index + 1].y < peak.y) {
                console.log('Found a peak...');
                maxims.push(peak);
            }
        });
        console.log(maxims);
        maxims = maxims.sort(function(a, b) {
            return b.y - a.y;
        })
        this.maxPoints = maxims;
        return this;
    },
    createRidge: function(maxPoint, peaks) {
        var ridge = [maxPoint, {
            x: maxPoint.x,
            y: findMinPoint(peaks).y
        }];

        var ridgeHeight = ridge[0].y - ridge[1].y - 5;
        var ridgeResolution = 40;
        var simpleUnit = ridgeHeight / ridgeResolution;
        var unit = simpleUnit;

        var HRRidge = [ridge[0]];

        var smallDetail = new Simple1DNoise();
        var mediumDetail = new Simple1DNoise();
        var bigDetail = new Simple1DNoise();
        smallDetail.setScale(0.3);
        mediumDetail.setScale(0.1);
        bigDetail.setScale(0.05);

        for (var i = 1; i < ridgeResolution; i++) {
            var perlin = (smallDetail.getVal(ridge[0].y - unit) * 0.3 + mediumDetail.getVal(ridge[0].y - unit) * 0.5 + bigDetail.getVal(ridge[0].y - unit)) * 2 / 3;
            perlin = perlin - 0.5;
            HRRidge.push({
                x: ridge[0].x + perlin * 3 * i / 3,
                y: ridge[0].y - unit
            });
            // }


            unit += simpleUnit;
        }

        return HRRidge;
    },
    drawRidges: function() {
        var _this = this;
        this.findMaxPoints();
        console.log(this.maxPoints);
        this.maxPoints.forEach(function(ridge) {
            var ridge = _this.createRidge(ridge, _this.HighResPath);

            var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            newpath.setAttributeNS(null, "id", "ridgeId");
            var strokePath = '';
            ridge.forEach(function(point) {
                strokePath += (point.x)*3 + ' ' + (point.y * -1 + 150)*3 + ' ';
            })
            newpath.setAttributeNS(null, "d", "M " + strokePath);
            newpath.setAttributeNS(null, "stroke", "rgba(0,0,0,0.5)");
            newpath.setAttributeNS(null, "stroke-width", 1.3);
            newpath.setAttributeNS(null, "opacity", 1);
            newpath.setAttributeNS(null, "fill", "none");

            _this.svg.appendChild(newpath);

        });
        return this;

    },
    drawOutline: function() {
        var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        newpath.setAttributeNS(null, "id", "pathIdD");
        var strokePath = '';

        this.HighResPath.forEach(function(point) {
            strokePath += (point.x)*3 + ' ' + (point.y * -1 + 150)*3 + ' ';
        })
        newpath.setAttributeNS(null, "d", "M " + strokePath);
        newpath.setAttributeNS(null, "stroke", "rgba(0,0,0,0.75)");
        newpath.setAttributeNS(null, "stroke-width", 3);
        newpath.setAttributeNS(null, "opacity", 1);
        newpath.setAttributeNS(null, "fill", "none");

        this.svg.appendChild(newpath);
        return this;
    },
    createSVGElement: function() {
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.svg.setAttribute('style', 'border: 0px; margin-left: 25px');
        this.svg.setAttribute('width', '2500 ');
        this.svg.setAttribute('height', '600');
        this.svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
        document.body.appendChild(this.svg);

        return this;
    },
    init: function(config) {
        config = config || {};
        this.peaksAmount = config.peaksAmount || 4;
        this.resolution = config.resolution || 500;
        this.maxHeight = config.maxHeight || 50;
        this.maxWidth = config.maxWidth || 100;


        this.simplePeaksGenerator()
            .increaseResolution()
            .perlinPeaks();

        console.log(this)

        // when we have all the data, we render it
        this.createSVGElement()
            .drawOutline()
            .drawRidges();
    }
}

var mountainSet = Object.create(mountains);

mountainSet.init({
    peaksAmount: 3
});
