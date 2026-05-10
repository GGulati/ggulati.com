---
title: "Boidwatching"
date: "2011-04-09"
slug: "boidwatching"
excerpt: "I'm sure you're all familiar with Nicolas Cage and his birdlike photoshopped hair. Or should I say... boidlike hair?"
---

I'm sure you're all familiar with Nicolas Cage and his birdlike photoshopped hair. Or should I say... boidlike hair?

<figure class="narrow-figure">
  <img src="/assets/hairisboid.png" alt="My hair is a boid. Your argument is NULL." />
</figure>

Boids are just a digital attempt to recreate birds in computer simulations, be they in games or for academic purposes. The favored algorithm family to emulate the unpredictability of groups of animals - including birds - is called _flocking_. And one of the most famous flocking algorithms is the Boids Flocking Algorithm developed by [Craig Reynolds](http://www.red3d.com/cwr/boids/).

Boids is a wonderful flocking algorithm due to its simplicity and ease of implementation, since it relies on 3 behavioral components to simulate a single bird's actions. The real beauty of it is that by creating 20 or 30 of these simple little boids results in a complex-looking, unpredictable yet deterministic flocking behavior.

The three rules of boids are _cohesion_, _separation_ and _alignment_. _Cohesion_ emulates the idea that the member of a flock tries to stay with the flock. _Separation_ mirrors the tendency of animals to keep some personal space between themselves and their nearest neighbors. Finally, _alignment_ acknowledges that animals in a flock tend to have roughly the same speed.

Each of these rules has to evaluated once per frame for each boid. Each rule can be written as a programmatically function that always returns a vector.

Programmatically speaking, cohesion requires each boid to know where the center of mass of the flock is. You can calculate the position in 2D or 3D space by adding together the positions of each boid in a flock, then dividing each component by the total number of boids in that flock.

Separation, on the other hand, is a much stronger behavior. The boid finds each boid within a certain distance of itself and finds the directional vector heading away from the neighboring boid. By adding together all of these repulsion vectors, you have an avoidance vector.

The third cardinal component of boids, alignment, is also a fast calculation. However, it requires the boid to know the heading of the flock. To calculate the heading of the flock, add together the heading vectors of each of the boids, then divide each component by the total number of boids in that flock.

The last step of a boid is to add together these three vectors, then move itself accordingly. You may want to have vectors of magnitude greater than some threshold to be scaled down so as not to exceed a maximum movement magnitude.
