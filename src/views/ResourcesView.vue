<script setup>
import ResourceCard from '../components/ResourceCard.vue'
import { resources } from '../data/seedEvents'
</script>

<template>
  <h1 id="page-heading" tabindex="-1" class="mb-4">Educational resources</h1>
  <div class="row g-4">
    <div v-for="r in resources" :key="r.id" class="col-12 col-md-6 col-lg-4 d-flex"><ResourceCard :resource="r" /></div>
  </div>
</template>
