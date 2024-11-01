<template>
  <form @submit.prevent class="flex flex-col" enctype="multipart/form-data">
    <section>
      <input @change="onChangeFile" type="file" />
      <input v-model="form.interval" type="range" step="1" min="0" max="5000" class="text-black" /> {{ form.interval }} ms
    </section>
    <section>
      <button @click="onSubmit" type="submit">Print</button>
    </section>
    <section v-if="errors.length > 0">
      <p v-for="error in errors">
        <span>{{ error }}</span>
      </p>
    </section>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const errors = ref([])
const form = reactive({
  interval: 0,
  file: null
})


function onChangeFile(event : Event) : void {
  const { files } = event.target
  if (files && files[0]) {
    form.file = files[0]
  }
}

async function onSubmit() : Promise<void> {
  clearErrors()

  if (form.file) {
    const formData = new FormData();
    for (const key in form) {
      formData.set(key, form[key]);
    }
    const response = await fetch(__API_PATH__, { method: 'POST', body: formData });
    if (!response.ok) {
      handleResponseError(response)
    }
  } else {
    addError('NO FILE')
  }
}

async function handleResponseError(response : any) : Promise<void> {
  const data : any = await response.json();
  if (typeof data.message === 'string') {
    addError(data.message)
  }
}

function addError(message : string) :void {
  errors.value.push(message)
}

function clearErrors() : void {
  errors.value.length = 0
}

// function readFileByClient(file : File) : void {
//   const reader = new FileReader();
//   reader.addEventListener('load', () => { console.log(reader.result) })
//   reader.readAsText(file);
// }
</script>
