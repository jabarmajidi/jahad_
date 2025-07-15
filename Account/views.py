from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from Account.forms import CustomLoginForm

def login_view(request):
    if request.method == 'POST':
        form = CustomLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('/')
            else:
                form.add_error(None, 'نام کاربری یا رمز عبور اشتباه است')
    else:
        form = CustomLoginForm()
    return render(request, 'loginPage.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('/')
