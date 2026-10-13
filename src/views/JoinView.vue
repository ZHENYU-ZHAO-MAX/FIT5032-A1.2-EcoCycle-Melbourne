<script setup>
import VolunteerForm from '../components/VolunteerForm.vue'
import { useEvents } from '../composables/useEvents'

const { events, loading } = useEvents()
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-9 col-lg-7">
      <h1 id="page-heading" tabindex="-1" class="mb-3">Volunteer registration</h1>
      <p v-if="loading" role="status">Loading events…</p>
      <VolunteerForm v-else :events="events" />
    </div>
  </div>
</template>
