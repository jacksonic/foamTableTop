spritesheetplot = {
  enemy: {
    "name": "enemy",
    "left": 0,
    "top": 0,
    "width": 122,
    "height": 152,
    "centerX": 61,
    "centerY": 76
  },
  missileflight: {
    "name": "missileflight",
    "left": 127,
    "top": 0,
    "width": 77,
    "height": 197,
    "centerX": 166,
    "centerY": 98
  },
  playerprojectile: {
    "name": "playerprojectile",
    "left": 211,
    "top": 0,
    "width": 19,
    "height": 54,
    "centerX": 220,
    "centerY": 27
  },
  enemyprojectile: {
    "name": "enemyprojectile",
    "left": 236,
    "top": 0,
    "width": 23,
    "height": 22,
    "centerX": 247,
    "centerY": 11
  },
  turret: {
    "name": "turret",
    "left": 267,
    "top": 0,
    "width": 135,
    "height": 140,
    "centerX": 334,
    "centerY": 70
  },
  gun: {
    "name": "gun",
    "left": 413,
    "top": 0,
    "width": 29,
    "height": 168,
    "centerX": 427,
    "centerY": 84
  },
  missileready: {
    "name": "missileready",
    "left": 455,
    "top": 0,
    "width": 76,
    "height": 161,
    "centerX": 493,
    "centerY": 80
  },
  rift: {
    "name": "rift",
    "left": 550,
    "top": 0,
    "width": 802,
    "height": 316,
    "centerX": 951,
    "centerY": 158
  },
  explosion: {
    "name": "explosion",
    "sequence": [{
      "left": 1372,
      "top": 0,
      "width": 233,
      "height": 178,
      "centerX": 1488,
      "centerY": 89
    }, {
      "left": 1623,
      "top": 0,
      "width": 244,
      "height": 197,
      "centerX": 1745,
      "centerY": 98
    }, {
      "left": 1881,
      "top": 0,
      "width": 320,
      "height": 242,
      "centerX": 2041,
      "centerY": 121
    }, {
      "left": 2223,
      "top": 0,
      "width": 414,
      "height": 348,
      "centerX": 2430,
      "centerY": 174
    }, {
      "left": 0,
      "top": 342,
      "width": 725,
      "height": 541,
      "centerX": 362,
      "centerY": 612
    }],
  },
  carrier: {
    "name": "carrier",
    "left": 797,
    "top": 366,
    "width": 303,
    "height": 603,
    "centerX": 950,
    "centerY": 600
  },
  drone: {
    "name": "drone",
    "left": 1124,
    "top": 368,
    "width": 72,
    "height": 72,
    "centerX": 1160,
    "centerY": 404
  }
};

spritesheetplot_sm = {};
for (var key in spritesheetplot) {
  var src = spritesheetplot[key];
  var dst = {};
  for (var ikey in src) {
    if ( typeof src[ikey] === 'number' ) {
      dst[ikey] = src[ikey] / 2;
    } else if ( Array.isArray(src[ikey]) ) {
      dst[ikey] = [];
      for ( var i = 0; i < src[ikey].length; i++ ) {
        var item = {};
        for (var jkey in src[ikey][i]) {
          if ( typeof src[ikey][i][jkey] === 'number' ) {
            item[jkey] = src[ikey][i][jkey] / 2;
          } else {
            item[jkey] = src[ikey][i][jkey];
          }
        }
        dst[ikey][i] = item;
      }
    } else {
      dst[ikey] = src[ikey];
    }
  }
  spritesheetplot_sm[key] = dst;
}
