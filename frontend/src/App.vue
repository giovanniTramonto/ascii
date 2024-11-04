<template>
  <form @submit.prevent class="form" enctype="multipart/form-data">
    <section>
      <input @change="onChangeFile" type="file" />
      <input v-model="form.interval" type="range" step="1" min="0" max="5000" /> {{ form.interval }} ms
    </section>
    <section>
      <button @click="onSubmit" type="submit" class="button" :disabled=isTextUploaded>Print</button>
    </section>
    <section v-if="errors.length > 0">
      <p v-for="error in errors">
        <span>{{ error }}</span>
      </p>
    </section>
  </form>

  <div v-if="textLines.length > 0" class="background">
    <div class="background-inner">
      <span v-for="line in textLines">{{ line }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

const socket = new WebSocket(__WSS_PATH__, ['ascii']);
const textLines = ref([])
const isTextUploaded = ref(false)
const errors = ref([])
const form = reactive({
  interval: 0,
  file: null
})

socket.addEventListener('message', (message : MessageEvent) => {
  textLines.value.push(message.data)
});

function onChangeFile(event : Event) : void {
  const { files } = event.target
  if (files && files[0]) {
    form.file = files[0]
  }
}

async function onSubmit() : Promise<void> {
  reset()

  if (form.file) {
    const formData = new FormData();
    for (const key in form) {
      formData.set(key, form[key]);
    }
    const response = await fetch(__API_PATH__, { method: 'POST', body: formData });
    if (response.status === 200) {
      isTextUploaded.value = true
    } else if (response.status === 400) {
      const text = await response.text()
      addError(text)
    } else {
      addError('SOMETHING WENT WRONG')
    }
  } else {
    addError('NO FILE')
  }
}

function addError(message : string) :void {
  errors.value.push(message)
}

function reset() : void {
  errors.value.length = 0
  isTextUploaded.value = false
}
</script>

<style scoped>
.background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.background-inner {
  white-space: pre;
  font-family: monospace;
}
.background-inner span {
  display: block;
}

.form {
  display: flex;
  flex-direction: column;
}
.form section {
  padding: 1rem;
}

.button {
  background: white;
  padding: 0.25rem 0.5rem;
  color: black;
}
</style>