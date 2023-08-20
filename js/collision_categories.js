class CollisionLayer {
    static EDIBLE = 1;
    static WALL = 2;
    static GRATE = 4;
    static NOT_GRATE = CollisionLayer.EDIBLE | CollisionLayer.WALL;
    static ALL = CollisionLayer.GRATE | CollisionLayer.NOT_GRATE;
}
