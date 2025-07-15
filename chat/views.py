from django.http import JsonResponse
from django.shortcuts import render
import random
import json
import numpy as np
from hazm import Normalizer, word_tokenize as hazm_word_tokenize, Lemmatizer, word_tokenize
import tensorflow
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout

from admin_.models import IranData

numbers = {
    'سنندج': {
        'تعاونی 10': 2,
        'تعاونی 12': 3,
        'تعاونی 14': 5
    },
    'تهران': {
        'تعاونی 10': 2,
        'تعاونی 14': 3,
        'تعاونی 11': 5
    },
    'کامیاران':{
        'تعاونی 10': 2,
        'تعاونی 18': 3,
        'تعاونی 16': 5
    },
}

conversation_memory = {}

def index(request):
    return render(request, 'chatbot_project/index.htm')


def chatBot(request):
    user_id = request.session.session_key
    if not user_id:
        request.session.create()
        user_id = request.session.session_key

    query = str(request.GET.get("query"))
    normalizer = Normalizer()
    lemmatizer = Lemmatizer()

    with open('jsonfile.json', encoding='utf-8') as fileobj:
        content = fileobj.read()
        readobj = json.loads(content)

    words = []
    classes = []
    documents = []
    stop_words = ['است', 'و', 'این', 'آن', 'من', 'شما']
    cleaned_word = []

    for intent in readobj['intents']:
        for pattern in intent['patterns']:
            pattern = normalizer.normalize(pattern)
            word_list = hazm_word_tokenize(pattern)
            words.extend(word_list)
            documents.append((word_list, intent['tag']))
            if intent['tag'] not in classes:
                classes.append(intent['tag'])

    words = sorted(set(words))
    classes = sorted(set(classes))

    def clean_corpus(words):
        words = [doc.lower() for doc in words]
        for w in words:
            if w not in stop_words and w.isalpha():
                w = lemmatizer.lemmatize(w)
                cleaned_word.append(w)
        return cleaned_word

    words = sorted(set(words))
    classes = sorted(set(classes))

    training = []
    output_empty = [0] * len(classes)

    for document in documents:
        bag = []
        word_patterns = document[0]

        word_patterns = [lemmatizer.lemmatize(word.lower()) for word in word_patterns]

        for word in words:
            bag.append(1) if word in word_patterns else bag.append(0)
        output_row = list(output_empty)
        output_row[classes.index(document[1])] = 1
        training.append([bag, output_row])

    random.shuffle(training)
    training = np.array(training, dtype=object)
    train_x = list(training[:, 0])
    train_y = list(training[:, 1])

    model = Sequential([
        Dense(128, input_shape=(len(train_x[0]),), activation='relu'),
        Dropout(0.2),
        Dense(64, activation='relu'),
        Dropout(0.2),
        Dense(len(train_y[0]), activation='softmax')
    ])
    initial_learning_rate = 0.01
    lr_schedule = tensorflow.keras.optimizers.schedules.ExponentialDecay(initial_learning_rate, decay_steps=10000,
                                                                         decay_rate=0.9)
    sgd = tensorflow.keras.optimizers.SGD(learning_rate=lr_schedule, momentum=0.9, nesterov=True)
    model.compile(loss='categorical_crossentropy', optimizer=sgd, metrics=['accuracy'])
    history = model.fit(np.array(train_x), np.array(train_y), epochs=20, batch_size=1, verbose=7)

    def cleaning_up_message(message):
        message = normalizer.normalize(message)
        message_word = hazm_word_tokenize(message)
        message_word = [lemmatizer.lemmatize(word.casefold()) for word in message_word]
        return message_word

    def bag_of_words(message):
        message_word = cleaning_up_message(message)
        bag = [0] * len(words)
        for w in message_word:
            for i, word in enumerate(words):
                if word == w:
                    bag[i] = 1
        return np.array(bag)

    INTENT_NOT_FOUND_THRESHOLD = 0.25

    def predict_intent_tag(message):
        BOW = bag_of_words(message)
        res = model.predict(np.array([BOW]))[0]
        results = [[i, r] for i, r in enumerate(res) if r > INTENT_NOT_FOUND_THRESHOLD]
        results.sort(key=lambda x: x[1], reverse=True)
        return_list = []
        for r in results:
            return_list.append({'intent': classes[r[0]], 'probability': str(r[1])})
        return return_list

    def find_most_similar(input_str, options):
        from fuzzywuzzy import process
        best_match, score = process.extractOne(input_str, options)
        return best_match if score > 80 else None

    def get_response(intents_list, intents_json, message):
        tag = intents_list[0]['intent']
        list_of_intents = intents_json['intents']

        if tag == 'find-province':
            all_location = IranData.objects.all()
            all_location_list = []
            for location in all_location:
                all_location_list.append(location.name)
            normalizer = Normalizer()
            normalized_message = normalizer.normalize(message)
            tokens = word_tokenize(normalized_message)

            # پیدا کردن استان‌ها در متن
            detected_provinces = [province for province in all_location_list if province in tokens]
            for i in list_of_intents:
                if i['tag'] == tag:
                    link = ''
                    function = ''
                    if i['link'] != '':
                        link = i['link']
                    if i['function'] != '':
                        function = i['function']
                    result = random.choice(i['responses'])
                    otherDetail = {
                        'province': detected_provinces[0]
                    }
                    result = [result, link, function, otherDetail]
                    return result
            return

        for i in list_of_intents:
            if i['tag'] == tag:
                link = ''
                function = ''
                if i['link'] != '':
                    link = i['link']
                if i['function'] != '':
                    function = i['function']
                result = random.choice(i['responses'])
                result = [result, link, function, {}]
                return result

    conversation_memory[user_id] = query

    message = query
    previous_message = conversation_memory.get(user_id, "")
    if previous_message:
        message = f"{previous_message} {message}"
    ints = predict_intent_tag(message)
    bot_response = get_response(ints, readobj, query)
    print(bot_response)
    return JsonResponse({"Bot": bot_response[0], 'link':bot_response[1], 'function': bot_response[2]
                            ,'otherDetail': bot_response[3]} )
