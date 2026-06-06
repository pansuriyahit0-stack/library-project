#include<iostream>
#include<string>
#include<exception>
#include<vector>
#include<algorithm>
#include<fstream>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

string add(int d,int m,int y,int added){
    switch (m)
    {
    case 2:
        if(d+added>28){
            d=d+added;
            d%=28;
            m++;
            if(m>12){
                m=1;
                y++;
            }
        }
        else{
            d+=added;
        }
        break;
    case 1:
    case 3:
    case 5:
    case 7:
    case 8:
    case 10:
    case 12:
        if(d+added>31){
            d=d+added;
            d%=31;
            m++;
            if(m>12){
                m=1;
                y++;
            }
        }
        else{
            d+=added;
        }

        break;
    default:
        if(d+added>30){
            d=d+added;
            d%=30;
            m++;
            if(m>12){
                m=1;
                y++;
            }
        }
        else{
            d+=added;
        }
        break;
    }
    string date="";
    date+=to_string(d);
    date+='/';
    date+=to_string(m);
    date+='/';
    date+=to_string(y);
    return date;
}

class existingBook:public exception{
public:
    const char* what() const throw(){
        return "Book already been collected";
    }
};

class noBook:public exception{
public:
    const char* what() const throw(){
        return "No book found";
    }
};

class Person{
protected:
    string id;
public:
    Person(string id):id(id){};
    virtual void add_book(int day,int month,int year,string book)=0;
    virtual void remove_book(string book)=0;
    virtual void addDueDate(int d,int m,int y)=0;
    virtual void removeDueDate(int ind)=0;
    virtual vector<string> get_books()=0;
    virtual vector<string> get_dueDates()=0;
    virtual ~Person(){};
};

class Student:public Person{
    string name;
    vector<string>books;
    vector<string>dueDates;
public:
    Student(string name,vector<string>books,vector<string>dueDates,string id):name(name),books(books),dueDates(dueDates),Person(id){}
    void add_book(int day,int month,int year,string book){
        if(find(books.begin(),books.end(),book)==books.end()){
            books.push_back(book);
            addDueDate(day,month,year);
            // books+=' ';
            // return books;
        }
        else{
            existingBook eB;
            throw(eB);
        }
    }
    void remove_book(string book){
        // auto ind=books.find(book);
        if(find(books.begin(),books.end(),book)==books.end()){
            noBook nb;
            throw(nb);
        }
        else{
            int ind=find(books.begin(),books.end(),book)-books.begin();
            books.erase(books.begin()+ind);
            removeDueDate(ind);
            // return books;
        }
    }
    void addDueDate(int d,int m,int y){
        // string date="";
        string dd=add(d,m,y,20);
        dueDates.push_back(dd);
        // return dueDates;
    }
    void removeDueDate(int ind){
        dueDates.erase(dueDates.begin()+ind);
        // return dueDates;
    }
    vector<string> get_books(){
        return books;
    }
    vector<string> get_dueDates(){
        return dueDates;
    }
    ~Student(){};
};
class Faculty:public Person{
    string name;
    vector<string>books;
    vector<string>dueDates;
public:
    Faculty(string name,vector<string>books,vector<string>dueDates,string id):name(name),books(books),dueDates(dueDates),Person(id){}
    void add_book(int day,int month,int year,string book){
        if(find(books.begin(),books.end(),book)==books.end()){
            books.push_back(book);
            addDueDate(day,month,year);
            // return books;
        }
        else{
            existingBook eB;
            throw(eB);
        }
    }
    void remove_book(string book){
        // auto ind=books.find(book);
        if(find(books.begin(),books.end(),book)==books.end()){
            noBook nb;
            throw(nb);
        }
        else{
            int ind=find(books.begin(),books.end(),book)-books.begin();
            books.erase(books.begin()+ind);
            removeDueDate(ind);
            // return books;
        }
    }
    void addDueDate(int d,int m,int y){
        string dd=add(d,m,y,30);
        dueDates.push_back(dd);
        // return dueDates;
    }
    void removeDueDate(int ind){
        dueDates.erase(dueDates.begin()+ind);
        // return dueDates;
    }
    vector<string> get_books(){
        return books;
    }
    vector<string> get_dueDates(){
        return dueDates;
    }
    ~Faculty(){};
};


int main(){
    string input;
    getline(cin,input);
    json data=json::parse(input);
    json person=data["person"];
    string role = data.value("role", "");
    string bookname = data.value("bookname", "");
    string operation = data.value("operation", "");
    string name = person.value("name", "");
    // vector<string>books = person["books"].get<vector<string>>();
    // vector<string>dueDates=person["dueDates"].get<vector<string>>();
    vector<string> books = person.value("books", vector<string>{});
    vector<string> dueDates = person.value("dueDates", vector<string>{});
    string id = person.value("id", "");
    int day=data.value("day",0);
    int month=data.value("month",0);
    int year=data.value("year",0);
    // auto today=floor<days>(system_clock::now());
    Person* p;
    if(role=="student"){
        p=new Student(name,books,dueDates,id);
    }
    else{
        p=new Faculty(name,books,dueDates,id);
    }

    if(operation=="add"){
        
        try{
            p->add_book(day,month,year,bookname);
            data["person"]["books"] = p->get_books();
            data["person"]["dueDates"] = p->get_dueDates();
        }
        catch(existingBook& e){
            data["message"]=e.what();
        }

    }
    else if(operation=="remove"){
        // string out=p->remove_book(bookname);
        // if(out=="book not exist"){
        //     data["message"]=out;
        // }
        // else data["person"]["books"]=out;
        try{
            p->remove_book(bookname);
            data["person"]["books"]=p->get_books();
            data["person"]["dueDates"] = p->get_dueDates();
        }
        catch(noBook& e){
            data["message"]=e.what();
        }
    }


    delete p;
    cout<<data.dump();
    

    return 0;
}