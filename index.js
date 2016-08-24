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


function generatePeak(maxHeight, maxWidth) {
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
        y: getRandomArbitrary(10, 50)
    };

    return peak;
}

function randomPeaks(amount) {
    var peaks = [];
    amount = amount || 2; //default to 2 peaks

    for (var i = 0; i < amount; i++) {
        peaks.push(generatePeak());
    }

    return peaks;
}

function separatePeaks(peaks) {

    peaks = peaks.map(function(peak, index, originalPeaks) {
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

    return peaks;
}


function getSideIntercept(firstA, secondA, firstB, secondB) {
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
}

function joinPeaks(peaks) {

    return peaks.reduce(function(newPeaks, peak, index, originalPeaks) {

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
    }, [])

}

function findLineFormula(pointA, pointB) {
    var slope = (pointB.y - pointA.y) / (pointB.x - pointA.x);

    var constant = (slope * (-pointA.x)) + pointA.y;

    return function(x) {
        return x * slope + constant;
    }
}

function increaseResolution(peaks, resolution) {
    //we get how small the increment to create new points between bases, peaks and valleys
    //I think this is simillar to marching squares or sth
    var simpleUnit = peaks[peaks.length - 1].x / resolution;
    var unit = simpleUnit;
    // console.log(unit);
    return peaks.reduce(function(HRPeaks, peak, index, originalPeaks) {
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

}

function randomPositive() {
    return Math.random() > 0.5 ? 1 : -1;
}

function perlinPeaks(peaks) {
    var smallDetail = new Simple1DNoise();
    var mediumDetail = new Simple1DNoise();
    var bigDetail = new Simple1DNoise();
    smallDetail.setScale(0.5);
    mediumDetail.setScale(0.22);
    bigDetail.setScale(0.05);


    return peaks.map(function(point) {
        var perlin = (smallDetail.getVal(point.x) * 0.1 + mediumDetail.getVal(point.x) * 0.5 + bigDetail.getVal(point.x)) * 1 / 3;
        return {
            x: point.x,
            y: point.y + perlin * 30
        }
    });
}

function findMaxPoint(peaks) {
    return peaks.sort(function(a, b) {
        return b.y - a.y;
    })[0];
}

function findMinPoint(peaks) {
    return peaks.sort(function(a, b) {
        return a.y - b.y;
    })[0];
}


function findMaxPoints(peaks) {
    var width = peaks.length; //peak width in units
    var margin = width * 0.01; //limit on each side to count as peak

    var counter = {
        currentMax: peaks[0],
        countUp: 0,
        countDown: 0
    }
    var maxims = [];

    

    return maxims;
}


function createRidge(peaks) {
    var maxPoint = findMaxPoint(peaks)

    var ridge = [maxPoint, {
        x: maxPoint.x,
        y: findMinPoint(peaks).y
    }];

    var ridgeHeight = ridge[0].y - ridge[1].y;
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
        var perlin = (smallDetail.getVal(ridge[0].y - unit) * 0.1 + mediumDetail.getVal(ridge[0].y - unit) * 0.5 + bigDetail.getVal(ridge[0].y - unit)) * 2 / 3;
        perlin = perlin - 0.5;
        HRRidge.push({
            x: ridge[0].x + perlin * 3 * i / 3,
            y: ridge[0].y - unit
        });
        // }


        unit += simpleUnit;
    }

    return HRRidge;
}


function drawRidges(peaks) {

    var ridge = createRidge(peaks);


    var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newpath.setAttributeNS(null, "id", "ridgeId");
    var strokePath = '';
    ridge.forEach(function(point) {
        strokePath += (point.x * 3) + ' ' + (point.y * -1 + 150) * 3 + ' ';
    })
    newpath.setAttributeNS(null, "d", "M " + strokePath);
    newpath.setAttributeNS(null, "stroke", "black");
    newpath.setAttributeNS(null, "stroke-width", 1.5);
    newpath.setAttributeNS(null, "opacity", 1);
    newpath.setAttributeNS(null, "fill", "none");

    return newpath;

}

function drawOutline(peaks) {
    var newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    newpath.setAttributeNS(null, "id", "pathIdD");
    var strokePath = '';

    peaks.forEach(function(point) {
        strokePath += (point.x * 3) + ' ' + (point.y * -1 + 150) * 3 + ' ';
    })
    newpath.setAttributeNS(null, "d", "M " + strokePath);
    newpath.setAttributeNS(null, "stroke", "black");
    newpath.setAttributeNS(null, "stroke-width", 1.5);
    newpath.setAttributeNS(null, "opacity", 1);
    newpath.setAttributeNS(null, "fill", "none");

    return newpath;
}

function draw(peaks) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('style', 'border: 1px solid black');
    svg.setAttribute('width', '1200 ');
    svg.setAttribute('height', '600');
    svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
    document.body.appendChild(svg);


    var outline = drawOutline(peaks);
    var ridges = drawRidges(peaks);
    svg.appendChild(outline);
    svg.appendChild(ridges);
}


var peaks = separatePeaks(randomPeaks(2));

var joinedPeaks = joinPeaks(peaks);
var increasedResolution = increaseResolution(joinedPeaks, 1000);
var perlined = perlinPeaks(increasedResolution);
console.log(findMaxPoints(perlined));
draw(perlined);
