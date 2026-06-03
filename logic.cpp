#include<iostream>
#include<fstream>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;
class Person{
protected:
    string id;
public:
    Person(string id):id(id){};
    virtual string add_book(string book)=0;
    virtual string remove_book(string book)=0;
};

class Student:public Person{
    string name;
    string books;
public:
    Student(string name,string books,string id):name(name),books(books),Person(id){}
    string add_book(string book){
        string err="";
        if(books.find(book)==string::npos){
            books+=book;
            books+=' ';
            return books;
        }
        else{
            err="already collocted";
            return err;
        }
    }
    string remove_book(string book){
        auto ind=books.find(book);
        if(ind==string::npos){
            // books+=book;
            // return books;
            string err="book not exist";
            return err;
        }
        else{
            books.erase(ind,book.length()+1);
            return books;
        }
    }
};

class Faculty:public Person{
    string name;
    string books;
public:
    Faculty(string name,string books,string id):name(name),books(books),Person(id){}
    string add_book(string book){
        string err="";
        if(books.find(book)==string::npos){
            books+=book+' ';
            return books;
        }
        else{
            err="already collocted";
            return err;
        }
    }
    string remove_book(string book){
        auto ind=books.find(book);
        if(ind==string::npos){
            // books+=book;
            // return books;
            string err="book not exist";
            return err;
        }
        else{
            books.erase(ind,book.length()+1);
            return books;
        }
    }
};
int main(){
    ifstream inFile("./data.json");

    json data;
    inFile>>data;

    inFile.close();

    // data["student"]["name"]=data["bookname"];
    // string name,books,bookname,id,role,operation;
    // role=data["role"];
    // name=data["student"]["name"];
    // books=data["student"]["books"];
    // bookname=data["bookname"];
    // id=data["student"]["id"];
    // operation=data["operation"];
    string role = data.value("role", "");
    string bookname = data.value("bookname", "");
    string operation = data.value("operation", "");
    string name = data["person"].value("name", "");
    string books = data["person"].value("books", "");
    string id = data["person"].value("id", "");
    Person* p;
    if(role=="student"){
        p=new Student(name,books,id);
    }
    else{
        p=new Faculty(name,books,id);
    }

    if(operation=="add"){
        string out=p->add_book(bookname);
        if(out=="already collected"){
            data["message"]=out;
        }
        else data["person"]["books"]=out;
    }
    else if(operation=="remove"){
        string out=p->remove_book(bookname);
        if(out=="book not exist"){
            data["message"]=out;
        }
        else data["person"]["books"]=out;
    }



    ofstream outFile("./data.json");
    outFile<<data.dump(4);
    outFile.close();
    

    return 0;
}