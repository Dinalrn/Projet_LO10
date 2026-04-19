class Event:

    def __init__(self, id, title, description, category, date, time, location, price, image, source):
        self.id = id
        self.title = title
        self.description = description
        self.category = category
        self.date = date
        self.time = time
        self.location = location
        self.price = price
        self.image = image
        self.source = source


    def to_json(self):

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "date": self.date,
            "time": self.time,
            "location": self.location,
            "price": self.price,
            "image": self.image,
            "source": self.source
        }