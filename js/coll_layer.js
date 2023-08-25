/*

side view


normal         reward sigs                  player    player grabbing
  v                v                          v          v
snake    FOOD                wall           snake     snake
snake           PHEREMONE    wall
snake    food   pheremone    WALL                     snake
snake                               GRATE             snake
SNAKE    food   pheremone    wall   grate   SNAKE     SNAKE



*/

/**
 * @enum
 */
class CollisionLayer {
    static FOOD             = 0b00001;
    static PHEREMONE        = 0b00010;
    static WALL             = 0b00100;
    static GRATE            = 0b01000;
    static SNAKE            = 0b10000;
    static SNAKE_MASK       = 0b11111;
    static FOOD_MASK        = 0b10101;
    static PHEREMONE_MASK   = 0b10110;
    static WALL_MASK        = 0b10111;
    static GRATE_MASK       = 0b11000;
    static PLAYER_GRAB_MASK = 0b11101;
    static PLAYER_MASK      = 0b10001;
    static SCANWORLD_MASK   = 0b01111;
}
