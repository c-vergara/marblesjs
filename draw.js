$(document).ready(function() {
  var max_width = 700;
  var max_height = 600;
  var max_vel = 5
  var max_rad = 20
  var max_stain_life = 100
  var paper = Raphael("canvas", max_width, max_height);
  var marbles_count = 7;
  var marbles = [];
  var anim_delay = 30;
  var vanish_delay = 80;
  var stains = [];
  var colors = [
    "BCBDAC",
    "CFBE27",
    "F27435",
    "F02475",
    "3B2D38",
    "2A044A",
    "0B2E59",
    "0D6759",
    "7AB317",
    "A0C55F"
  ];
  
  var generate_marbles = function(){
    while(true){
      marbles = [];
      for (var i = 0; i < marbles_count; i++) {
        var _rad = parseInt(Math.random()*max_rad+20);
        marbles.push({
          pos: {
            x: parseInt(Math.random()*max_width),
            y: parseInt(Math.random()*max_height)
          },
          vel: {
            x: parseInt(Math.random()*max_vel),
            y: parseInt(Math.random()*max_vel)
          },
          rad: _rad,
          mass: _rad*Math.PI*2,
          color: Raphael.color("#"+colors[i%colors.length]),
          dead: false
        })
      }
      if (! calculate_collisions(true)){
        return;
      }
    }
  }


  var reset_paper = function(){
    paper.clear();
    paper.rect(0, 0, max_width, max_height, 10).attr({fill: "#fff", stroke: "none"});

    for (var i = stains.length - 1; i >= 0; i--) {
      var _s = stains[i];
      paper.circle(_s.pos.x, _s.pos.y, _s.rad+21).attr({stroke: "none", fill: _s.color, "fill-opacity": .1*(_s.life/max_stain_life)});
      paper.circle(_s.pos.x, _s.pos.y, _s.rad+13).attr({stroke: "none", fill: _s.color, "fill-opacity": .1*(_s.life/max_stain_life)});
      paper.circle(_s.pos.x, _s.pos.y, _s.rad+8).attr({stroke: "none", fill: _s.color, "fill-opacity": .1*(_s.life/max_stain_life)});
    };
  }

  var calculate_collisions = function(check_valid){
    for (var i = 0; i < marbles.length; i++) {
      var _m_i = marbles[i];
        // detect collision with walls
      if(_m_i.pos.x + _m_i.rad >= max_width || _m_i.pos.x - _m_i.rad <= 0){
        if(check_valid){ return true; }
        _m_i.vel.x *= -1;
      }
      if(_m_i.pos.y + _m_i.rad >= max_height || _m_i.pos.y - _m_i.rad <= 0){
        if(check_valid){ return true; }
        _m_i.vel.y *= -1;
      }

      for (var j = i+1; j < marbles.length; j++) {
        var _m_j = marbles[j];

        var dx = _m_j.pos.x - _m_i.pos.x,
            dy = _m_j.pos.y - _m_i.pos.y,
            dist = Math.sqrt(dx * dx + dy * dy);

        // detect collision between marbles
        if (dist < _m_i.rad + _m_j.rad) {
          if(check_valid){ return true; }

          var angle = Math.atan2(dy, dx),
              sin = Math.sin(angle),
              cos = Math.cos(angle), 

          //rotate _m_i's position
          pos0 = {x: 0, y: 0}, //point

          //rotate _m_j's position
          pos1 = rotate(dx, dy, sin, cos, true),

          //rotate _m_i's velocity
          vel0 = rotate(_m_i.vel.x, _m_i.vel.y, sin, cos, true),

          //rotate _m_j's velocity
          vel1 = rotate(_m_j.vel.x, _m_j.vel.y, sin, cos, true),

          //collision reaction
          vxTotal = vel0.x - vel1.x;
          vel0.x = ((_m_i.mass - _m_j.mass) * vel0.x + 2 * _m_j.mass * vel1.x) /
                   (_m_i.mass + _m_j.mass);
          vel1.x = vxTotal + vel0.x;

          //update position
          pos0.x += vel0.x;
          pos1.x += vel1.x;

          //rotate positions back
          var pos0F = rotate(pos0.x, pos0.y, sin, cos, false),
              pos1F = rotate(pos1.x, pos1.y, sin, cos, false);

          //adjust positions to actual screen positions
          _m_j.pos.x = _m_i.pos.x + pos1F.x;
          _m_j.pos.y = _m_i.pos.y + pos1F.y;
          _m_i.pos.x = _m_i.pos.x + pos0F.x;
          _m_i.pos.y = _m_i.pos.y + pos0F.y;

          //rotate velocities back
          var vel0F = rotate(vel0.x, vel0.y, sin, cos, false),
              vel1F = rotate(vel1.x, vel1.y, sin, cos, false);
          _m_i.vel.x = vel0F.x;
          _m_i.vel.y = vel0F.y;
          _m_j.vel.x = vel1F.x;
          _m_j.vel.y = vel1F.y;

          render_collision_effect(i,j);
        }
      }
    }
    return false;
  }

  function rotate(x, y, sin, cos, reverse) {
    return {
        x: (reverse) ? (x * cos + y * sin) : (x * cos - y * sin),
        y: (reverse) ? (y * cos - x * sin) : (y * cos + x * sin)
    };
}

  var update_positions = function(){
    for (var i = 0; i < marbles.length; i++) {
      marbles[i].pos.x += marbles[i].vel.x
      marbles[i].pos.y += marbles[i].vel.y
    };
  }

  var render_collision_effect = function(i,j){
    var _m_i = marbles[i];
    var _m_j = marbles[j];

    if (_m_i.dead || _m_j.dead) {
      return;
    }

    stains.push({pos: { x: _m_i.pos.x, y: _m_i.pos.y} , rad: _m_i.rad, color: _m_i.color, life: max_stain_life});
    stains.push({pos: { x: _m_j.pos.x, y: _m_j.pos.y} , rad: _m_j.rad, color: _m_j.color, life: max_stain_life});
    
    // _m_i.color = Raphael.getColor();
    // _m_j.color = Raphael.getColor();
    _m_i.rad -= 1;
    _m_j.rad -= 1;

    if(_m_i.rad <= 10) { _m_i.dead = true; _m_i.mass = 5000; _m_i.vel.x *= 0.1; _m_i.vel.y *= 0.1;}
    if(_m_j.rad <= 10) { _m_j.dead = true; _m_j.mass = 5000; _m_j.vel.x *= 0.1; _m_j.vel.y *= 0.1;}
  }

  var draw_marbles = function(){
    for (var i = 0; i < marbles.length; i++) {
      paper.circle(marbles[i].pos.x, marbles[i].pos.y, marbles[i].rad)
      .attr({stroke: marbles[i].color, fill: marbles[i].color});
    };
  }

  generate_marbles();

  if(anim_interval){
    clearInterval(anim_interval);
  }
  var anim_interval = setInterval(function(){
    reset_paper();
    update_positions();
    calculate_collisions(false);
    draw_marbles();
  },
  anim_delay);

  if(vanish_interval){
    clearInterval(vanish_interval);
  }
  var vanish_interval = setInterval(function(){
    for (var i = stains.length - 1; i >= 0; i--) {
      if( stains[i].life <= 0 ){
        stains.splice(i, 1);
      }
      else {
        stains[i].life -= 1;
      }
    };
  },
  vanish_delay);

  $("#canvas").click(function(){
    clearInterval(anim_interval);
    clearInterval(vanish_interval);
  })
});