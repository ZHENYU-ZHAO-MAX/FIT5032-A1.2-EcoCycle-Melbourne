<script setup>


import { ref } from 'vue'

import EventCard from './components/EventCard.vue'
import ResourceCard from './components/ResourceCard.vue'
import VolunteerForm from './components/VolunteerForm.vue'

const events = ref([
  {
    id: 1,
    title: 'Community Clean-Up Day',
    date: '15 September 2026',
    location: 'Clayton'
  },
  {
    id: 2,
    title: 'E-Waste Collection Drive',
    date: '20 September 2026',
    location: 'Melbourne CBD'
  },
  {
    id: 3,
    title: 'Plastic Free Workshop',
    date: '25 September 2026',
    location: 'Glen Waverley'
  }
])

const resources = ref([
  {
    id: 1,
    title: 'How to Recycle Plastic',
    type: 'Guide'
  },
  {
    id: 2,
    title: 'Understanding Circular Economy',
    type: 'Article'
  },
  {
    id: 3,
    title: 'Composting Basics',
    type: 'Video'
  }
])


</script>

<template>

<div class="container py-5">
<h1 class="text-center">
EcoCycle Melbourne
</h1>

<p class="text-center">
Reduce Waste • Recycle Better
</p>

<h2 class="mt-5">
Upcoming Events
</h2>

<div class="row">
<div class="col-12 col-md-6 col-lg-4 mb-4"
v-for="event in events"
:key="event.id">
<EventCard :event="event"/>
</div>
</div>

<h2>
Educational Resources
</h2>

<div class="row">
<div class="col-12 col-md-6 col-lg-4 mb-4"
v-for="resource in resources"
:key="resource.id">
<ResourceCard :resource="resource"/>
</div>
</div>

<VolunteerForm/>

</div>

</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
