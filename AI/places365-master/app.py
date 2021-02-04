# PlacesCNN for scene classification
#
# by Bolei Zhou
# last modified by Bolei Zhou, Dec.27, 2017 with latest pytorch and torchvision (upgrade your torchvision please if there is trn.Resize error)
from flask import Flask,render_template,url_for,request
from flask import jsonify
import torch
from torch.autograd import Variable as V
import torchvision.models as models
from torchvision import transforms as trn
from torch.nn import functional as F
import os
from PIL import Image
import json

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/predict',methods=['POST'])
def predict():
# th architecture to use
    arch = 'resnet18'

# load the pre-trained weights
    model_file = '%s_places365.pth.tar' % arch
    if not os.access(model_file, os.W_OK):
        weight_url = 'http://places2.csail.mit.edu/models_places365/' + model_file
        os.system('wget ' + weight_url)

    model = models.__dict__[arch](num_classes=365)
    checkpoint = torch.load(model_file, map_location=lambda storage, loc: storage)
    state_dict = {str.replace(k,'module.',''): v for k,v in checkpoint['state_dict'].items()}
    model.load_state_dict(state_dict)
    model.eval()


# load the image transformer
    centre_crop = trn.Compose([
            trn.Resize((256,256)),
            trn.CenterCrop(224),
            trn.ToTensor(),
            trn.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

# load the class label
    file_name = 'categories_places365.txt'
    if not os.access(file_name, os.W_OK):
        synset_url = 'https://raw.githubusercontent.com/csailvision/places365/master/categories_places365.txt'
        os.system('wget ' + synset_url)
    classes = list()
    with open(file_name) as class_file:
        for line in class_file:
            classes.append(line.strip().split(' ')[0][3:])
    classes = tuple(classes)
    
    if request.method == 'POST':
        imageplace = request.form['message']
        print(imageplace)
# load the test image
    img_name = imageplace
    if len(img_name)==0:
        return render_template('result.html',prediction = "empty input")
    if not os.access(img_name, os.W_OK):
        img_url = 'http://places.csail.mit.edu/demo/' + img_name
        os.system('wget ' + img_url)

    img = Image.open(img_name)
    input_img = V(centre_crop(img).unsqueeze(0))

# forward pass
    logit = model.forward(input_img)
    h_x = F.softmax(logit, 1).data.squeeze()
    probs, idx = h_x.sort(0, True)

    print('{} prediction on {}'.format(arch,img_name))
    print([probs[0], classes[idx[0]]])
    resullt_dict={'first':[str(probs[0]), classes[idx[0]]],'second':[str(probs[1]), classes[idx[1]]],'third':[str(probs[2]), classes[idx[2]]],'forth':[str(probs[3]), classes[idx[3]]],'fifth':[str(probs[4]), classes[idx[4]]]}
    json_str=json.dumps(resullt_dict)
    print(json_str)
    
    #return render_template('result.html',prediction = [probs[0], classes[idx[0]]])
    return jsonify(resullt_dict)
# output the prediction
#for i in range(0, 5):
 #   print('{:.3f} -> {}'.format(probs[i], classes[idx[i]]))
if __name__ == '__main__':
    app.run(debug=True)