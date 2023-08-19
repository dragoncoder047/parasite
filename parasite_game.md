came via a dream 8/18/23.

# Parasite game

Player is a parasite robot (what like TBD)

All the NPC agents are snakes a la my snake demo from 8th grade (Except the tails curve in when pulled around a corner instead of follwing the original path exactly). The heads are dragon/Roboraptor profile, and the tail is a fork to match head.

## Snakes

They have 4 layer (2 hidden) neural network w/loopback memory neurons

### Senses (inputs)

* Sight:
    * 5 compass directions around front of head (-90, -45, 0, 45, 90 degrees):
       * 0.8 ** distance to wall (all of wall, grating report as wall)
    * For each of 5 closest (head to head) other snakes:
        * Distance (2 ** 0-1)
        * position (0-1) around head
        * Other's hue, saturation
        * Other's energy (value)
* Touch:
    * position of wall contact on each side (0.0-1.0 or -1 if no contact)
    * Is self's tail contacting another's head
    * Is self's head contacting another's tail
* Smell:
    * 0.8 ** distance to food
    * 0.8 ** pheremone amount and distance (hue pheremones)
* Sound:
    * Frequency and volume for each of 2 ears.
* internal energy
* self length
* self age
* 6 loopback

### Outputs

* thrust to move head
* desire to eat
* desire to mate with others
* outputting pheremones in direction, amount, color
* Grow amount
* 2 hue/saturation colors
* Frequency and volume of sound (composite method is pan=sin of angle to source, volume is exponential decay based on distance)
* 6 loopback

### Behavior

* Move using thrust -- uses energy
* Stick tounge out according to desire to eat, when it contacts food it counts as eaten
* When it contacts tail of another snake, if both snakes' "desire to mate" output is high enough a new snake is created using random merge of genome -- takes energy from both
* Desire to grow -- uses more energy than moving
* Color of snake is based on 6 feedback neurons (3 for head color, 3 for tail color, HSV interpolation)

## World behavior

Snakes move on floating point grid. Pheremones and food do too.

Snakes, food, and pheremones slow down with zero thrust.

Glass blocks, walls, and gratings are all square blocks.

* Walls cannot be moved and nothing passes through them.
* Glass blocks can be pushed, nothing can pass through them but snakes don't see them if they can be pushed in any direction.
* Gratings don't move, but food and pheremones can pass through them, snakes can't.
* The player can go anywhere

Food randomly spawns, slowly, to keep things alive

## Player snake

All require energy to so except eating. The player is a snake like any other, except inputs to NN are sent to computer output instead (haptic feedback for touch, web audio for sound, sight is moot as everything is drawn to screen) and outputs of NN come from player controls.

### Additional abilities

* Pick up and move another snake (grabbed using physics constraint and grabbed snake's thrust is zeroed when grabbed)
    * While picked up: Edit the genome of snake
    * Save the genome of a snake to my memory
* Mate with a snake using a saved genome (first in list is used here)
* Send "punish" or "reward" message to targeted snake.
* Edit the world (place walls, glass blocks, food, gratings, food sources, edit food source parameters)
* Eat food

If run out of energy, actions are limited (can only move very slowly and eat)

## Goal of game

There are levels. Player can go freely back to levels once they have beaten them (e.g. to get more snakes)

Each level is designed with a goal, slowly progressing in difficulty.

* get them to grow by some amount
* get them to release pheremones
* get them to mate
* get them to move to a certain area
* get them to follow each other like chains
* get them to sort each other by color
* etc more.

Player has limited resources available to build the world, some are already populated. Can take snakes form level to level but not resources.

# Controls and outputs

## Keyboard

* Arrow keys/WASD = move around
* Move Mouse = select target direction
* z=reward, x=punish
* c=eat, v=edit (only when holding)
* click snake=grab
* TODO other controls

* Use Web Audio api for sound from ears

## Gamepad

* Left stick=move, right stick=target
* X=punish, Y=reward
* R1=eat, R2=grab
* A=grab/release block, B=??
* Left stick pushed=spray pheremones, right stick pushed=??
* Select btn when holding snake=open edit menu for snake's brain

* Rumble left/right for contacting wall left/right

## Alternative I/O (plugins)

* Use Muse EEG readings for color of player snake
* After RE of Soundshirt use it for haptic feedback

# Stuff

* Use Synaptic <https://github.com/cazala/synaptic> for neural networks -- HOW TO EDIT WEIGHTS AND STUFF?
* Use Matter.js <https://github.com/liabru/matter-js/blob/master/examples/chains.js> for physics and motion
